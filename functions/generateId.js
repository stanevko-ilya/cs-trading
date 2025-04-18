async function generateId(validator=value=>true) {
    const id = Math.random().toString(16).slice(2);
    if (await validator(id)) return id;
    else return await generate_id(validator);
}

module.exports = generateId;