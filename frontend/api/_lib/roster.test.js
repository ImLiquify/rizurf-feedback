import { test } from 'node:test';
import assert from 'node:assert/strict';
import { internsToEmployeeRows } from './roster.js';

test('maps interns to employee rows, skipping former interns and missing emails', () => {
  const roles = new Map([['r1', 'Marketing Intern']]);
  const departments = new Map([['DEP-0001', 'Marketing']]);
  const rows = internsToEmployeeRows([
    { id: 'a', first_name: 'Ana', last_name: 'Lim', email_address: 'ana@x.com', status: 'Active', photo_url: 'https://p/a.jpg', role_id: 'r1', department_id: 'DEP-0001' },
    { id: 'b', first_name: 'Ben', last_name: 'Tan', email_address: 'ben@x.com', status: 'Former' },
    { id: 'c', first_name: 'Cy', last_name: 'Ng', email_address: '', status: 'Active' },
    { id: 'd', email_address: 'dee@x.com', status: 'Onboarding' },
  ], roles, departments);
  assert.deepEqual(rows, [
    ['a', 'ana@x.com', 'Ana Lim', 'https://p/a.jpg', 'Marketing Intern', 'Marketing'],
    ['d', 'dee@x.com', 'dee@x.com', null, null, null],
  ]);
});
