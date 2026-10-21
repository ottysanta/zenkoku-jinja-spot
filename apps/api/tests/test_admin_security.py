"""Synthetic principals only; no customer database, live service or credentials."""
import ast
import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient
from auth import require_admin, get_current_user

class AdminSecurityTests(unittest.TestCase):
    def test_runtime_roles(self):
        app = FastAPI()
        effects = []
        @app.post('/admin/test', dependencies=[Depends(require_admin)])
        def endpoint():
            effects.append(True)
            return {'ok': True}
        def anonymous():
            raise HTTPException(401)
        client = TestClient(app)
        app.dependency_overrides[get_current_user] = anonymous
        self.assertEqual(client.post('/admin/test').status_code, 401)
        for role in ('user', 'moderator'):
            app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role=role)
            self.assertEqual(client.post('/admin/test').status_code, 403)
        self.assertEqual(effects, [])
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role='admin')
        self.assertEqual(client.post('/admin/test').status_code, 200)
        self.assertEqual(effects, [True])

    def test_all_main_admin_routes_attach_guard(self):
        source = Path(__file__).resolve().parents[1] / 'main.py'
        tree = ast.parse(source.read_text())
        count = 0
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.args and isinstance(node.args[0], ast.Constant) and str(node.args[0].value).startswith('/admin/'):
                count += 1
                self.assertIn('Depends(require_admin)', ast.unparse(node))
        self.assertEqual(count, 3)
        router = (source.parent / 'admin_sources.py').read_text()
        self.assertIn('dependencies=[Depends(require_admin)]', router)

if __name__ == '__main__':
    unittest.main()
