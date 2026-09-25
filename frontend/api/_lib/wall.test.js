import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWall } from './wall.js';

const employees = [
  { id: 'emp-1', name: 'Alice' },
  { id: 'emp-2', name: 'Bob' },
  { id: 'emp-3', name: 'Carla' },
];

test('groups reviews into each employee\'s given and received lists', () => {
  const reviews = [
    { id: 'rev-1', authorId: 'emp-2', receiverId: 'emp-1' },
    { id: 'rev-2', authorId: 'emp-3', receiverId: 'emp-1' },
    { id: 'rev-3', authorId: 'emp-2', receiverId: 'emp-3' },
  ];

  const wall = buildWall(employees, reviews);
  const byId = Object.fromEntries(wall.map((e) => [e.id, e]));

  assert.equal(byId['emp-1'].reviewsGiven.length, 0);
  assert.equal(byId['emp-1'].reviewsReceived.length, 2);
  assert.equal(byId['emp-2'].reviewsGiven.length, 2);
  assert.equal(byId['emp-2'].reviewsReceived.length, 0);
  assert.equal(byId['emp-3'].reviewsGiven.length, 1);
  assert.equal(byId['emp-3'].reviewsReceived.length, 1);
});

test('every employee appears even with no reviews at all', () => {
  const wall = buildWall(employees, []);
  assert.equal(wall.length, 3);
  for (const employee of wall) {
    assert.deepEqual(employee.reviewsGiven, []);
    assert.deepEqual(employee.reviewsReceived, []);
  }
});

test('preserves every employee field alongside the grouped lists', () => {
  const wall = buildWall(employees, []);
  assert.equal(wall[0].name, 'Alice');
});
