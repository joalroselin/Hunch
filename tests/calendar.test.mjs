import assert from "node:assert/strict";
import {test} from "node:test";
import {monthDays,localDateKey,validPostDate} from "../lib/calendar.ts";
test("month grid covers leap days and year boundaries in complete Sunday weeks",()=>{
  for(const month of [new Date(2024,1,1,12),new Date(2026,10,1,12),new Date(2027,0,1,12)]) {
    const days=monthDays(month);
    assert.equal(days.length%7,0);
    assert.equal(new Set(days).size,days.length);
    assert.equal(new Date(`${days[0]}T12:00:00`).getDay(),0);
    assert.equal(new Date(`${days.at(-1)}T12:00:00`).getDay(),6);
    assert.ok(days.includes(localDateKey(month)));
  }
  assert.ok(monthDays(new Date(2024,1,1,12)).includes("2024-02-29"));
  assert.ok(monthDays(new Date(2027,0,1,12)).includes("2026-12-31"));
});
test("date validation rejects rollover and malformed values",()=>{
  for(const value of ["2026-02-29","2026-04-31","2026-13-01","not-a-date",""]) assert.equal(validPostDate(value),false);
  for(const value of ["2024-02-29","2026-11-12"]) assert.equal(validPostDate(value),true);
});
