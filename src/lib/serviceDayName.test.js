import { serviceDayName } from "./serviceDayName";

describe("serviceDayName", () => {
  test.each([
    // The worship leader's own hand-typed notes
    ["12/21/25", "4th Sunday of Advent"],
    ["2/8/26", "5th Sunday of Epiphany"],
    ["2/22/26", "1st Sunday of Lent"],
    // Season counting
    ["11/30/25", "1st Sunday of Advent"],
    ["12/28/25", "1st Sunday of Christmas"],
    ["4/12/26", "2nd Sunday of Easter"],
    ["6/7/26", "2nd Sunday after Pentecost"],
    ["10/18/26", "21st Sunday after Pentecost"],
    ["11/15/26", "25th Sunday after Pentecost"],
    // Named days
    ["12/24/25", "Christmas Eve"],
    ["2/18/26", "Ash Wednesday"],
    ["2/25/26", "Midweek Lenten Worship"],
    ["3/29/26", "Palm Sunday"],
    ["4/5/26", "Easter Sunday"],
    ["5/24/26", "Pentecost Sunday"],
    ["5/31/26", "Holy Trinity"],
    ["10/25/26", "Reformation Sunday"],
    ["11/22/26", "Christ the King Sunday"],
    ["11/26/26", "Thanksgiving"],
  ])("%s → %s", (date, name) => {
    expect(serviceDayName(date)).toBe(name);
  });

  test("an ordinary weekday has no name", () => {
    expect(serviceDayName("10/14/26")).toBeNull();
  });
});
