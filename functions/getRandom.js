function getRandom(min, max) {
    return Math.round(Math.random()*(max - min + 1) + min);
}
module.exports = getRandom;