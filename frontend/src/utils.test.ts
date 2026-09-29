import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roleLabel } from './utils.ts';

test('a gateway access role beats the Intern API title', () => {
  assert.equal(roleLabel({ role: 'admin', title: 'Intern' }), 'Admin');
  assert.equal(roleLabel({ role: 'hr', title: 'Employee' }), 'HR');
  assert.equal(roleLabel({ role: 'user', title: 'Intern' }), 'Intern');
  assert.equal(roleLabel({ role: 'user', title: null }), 'User');
});
