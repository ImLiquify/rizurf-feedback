import { test } from 'node:test';
import assert from 'node:assert/strict';
import { internsToEmployeeRows } from './roster.js';

test('maps interns to employee rows, skipping former interns and missing emails', () => {
  const rows = internsToEmployeeRows([
    { id: 'a', first_name: 'Ana', last_name: 'Lim', email_address: 'ana@x.com', status: 'Active' },
    { id: 'b', first_name: 'Ben', last_name: 'Tan', email_address: 'ben@x.com', status: 'Former' },
    { id: 'c', first_name: 'Cy', last_name: 'Ng', email_address: '', status: 'Active' },
    { id: 'd', email_address: 'dee@x.com', status: 'Onboarding' },
  ]);
  assert.deepEqual(rows, [
    ['a', 'ana@x.com', 'Ana Lim'],
    ['d', 'dee@x.com', 'dee@x.com'],
  ]);
});
