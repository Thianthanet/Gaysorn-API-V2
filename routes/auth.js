const express = require('express')
const { register, registerWithPhone, approveCustomer, getCustomerWaitApprove, createAdmin, login, getAdmin, updateAdmin, deleteAdmin, getAdminById } = require('../controllers/auth')
const router = express.Router()


router.post('/register', register)
router.post('/register-phone', registerWithPhone)
router.post('/approve/:userId', approveCustomer)
router.get('/waitApprove', getCustomerWaitApprove)
router.post('/login', login)
router.post('/createAdmin', createAdmin)
router.get('/getAdmin', getAdmin)
router.get('/getAdminById/:id', getAdminById)
router.patch('/updateAdmin', updateAdmin)
router.delete('/deleteAdmin/:id', deleteAdmin)

module.exports = router