import {expect} from "chai";
import {wallTimeToSeconds, wallTimeToHours, wallTimeToMinutes, wallTimeToDays} from "./time";

describe('time', function () {
    it('wallTimeToSeconds', function () {
        expect(wallTimeToSeconds('00:00:30')).to.be.equal(30);
        expect(wallTimeToSeconds('69:10:00')).to.be.equal(69 * 3600 + 10 * 60);
        expect(wallTimeToSeconds('01:00:00:00')).to.be.equal(24 * 3600);
    });
    it('wallTimeToMinutes', function () {
        expect(wallTimeToMinutes('00:00:30')).to.be.equal(0.5);
        expect(wallTimeToMinutes('79:10:00')).to.be.equal(79 * 60 + 10);
        expect(wallTimeToMinutes('01:00:00:00')).to.be.equal(24 * 60);
    });
    it('wallTimeToHours', function () {
        expect(wallTimeToHours('00:30:00')).to.be.equal(0.5);
        expect(wallTimeToHours('02:999:00:00')).to.be.equal(48 + 999);
        expect(wallTimeToHours('01:00:00:00')).to.be.equal(24);
    });
    it('wallTimeToDays', function () {
        expect(wallTimeToDays('01:12:00:00')).to.be.equal(1.5);
        expect(wallTimeToDays('05:00:00:00')).to.be.equal(5);
    });
});
