
const generatePromocode = () => {
    const length = 8
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let promocode = "PROMO";
    for (let i = 0; i < length; i++) {
        promocode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return promocode;
}

module.exports = generatePromocode