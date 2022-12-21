class AuthController{
    login(){
        console.log('===== LOGIN =====')
        return { id: 123, name: 'Thanh'}
    }
}
module.exports = new AuthController();
