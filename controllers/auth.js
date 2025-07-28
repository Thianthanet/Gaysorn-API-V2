const prisma = require('../config/prisma')
const { sendLineNotify } = require('../utils/line')
const jwt = require('jsonwebtoken')
const axios = require('axios');

// exports.register = async (req, res) => {
//     try {
//         const {
//             name,
//             phone,
//             nickname,
//             email,
//             userId,
//             unitId,
//             unitName,
//             buildingId,
//             buildingName,
//             companyId,
//             companyName
//         } = req.body;

//         // เช็กว่าลงทะเบียนไว้แล้วหรือยัง
//         const existingCustomer = await prisma.customer.findUnique({ where: { userId } });
//         if (existingCustomer) {
//             return res.status(200).json({
//                 message: 'ผู้ใช้นี้ได้ลงทะเบียนไว้แล้ว',
//                 customer: existingCustomer
//             });
//         }

//         let finalCompanyId = companyId;
//         let finalBuildingId = buildingId;
//         let finalUnitId = unitId;

//         if (!finalCompanyId) {
//             if (!companyName) {
//                 return res.status(400).json({ message: 'กรุณาระบุ companyName เพื่อสร้าง Company ใหม่' });
//             }

//             const newCompany = await prisma.company.create({
//                 data: { companyName }
//             });

//             finalCompanyId = newCompany.id;
//         }

//         if (!finalBuildingId) {
//             if (!buildingName) {
//                 return res.status(400).json({ message: 'กรุณาระบุ buildingName เพื่อสร้าง Building ใหม่' });
//             }

//             const newBuilding = await prisma.building.create({
//                 data: {
//                     buildingName,
//                     company: { connect: { id: finalCompanyId } }
//                 }
//             });

//             finalBuildingId = newBuilding.id;
//         }

//         if (!finalUnitId) {
//             if (!unitName) {
//                 return res.status(400).json({ message: 'กรุณาระบุ unitName เพื่อสร้าง Unit ใหม่' });
//             }

//             const existingUnit = await prisma.units.findFirst({
//                 where: {
//                     unitName,
//                     companyId: finalCompanyId
//                 }
//             });

//             if (existingUnit) {
//                 finalUnitId = existingUnit.id;
//             } else {
//                 const newUnit = await prisma.units.create({
//                     data: {
//                         unitName,
//                         company: { connect: { id: finalCompanyId } }
//                     }
//                 });

//                 finalUnitId = newUnit.id;
//             }
//         } else {
//             const existingUnit = await prisma.units.findUnique({ where: { id: finalUnitId } });

//             if (!existingUnit) {
//                 if (!unitName) {
//                     return res.status(400).json({ message: 'Unit ไม่พบในระบบ และไม่มี unitName สำหรับสร้างใหม่' });
//                 }

//                 const newUnit = await prisma.units.create({
//                     data: {
//                         unitName,
//                         company: { connect: { id: finalCompanyId } }
//                     }
//                 });

//                 finalUnitId = newUnit.id;
//             }
//         }

//         const newCustomer = await prisma.customer.create({
//             data: {
//                 name,
//                 phone,
//                 nickname,
//                 email,
//                 userId,
//                 unit: { connect: { id: finalUnitId } }
//             }
//         });

//         res.status(201).json({
//             message: 'สร้างลูกค้าเรียบร้อยแล้ว',
//             customer: newCustomer
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
//     }
// };

exports.register = async (req, res) => {
  try {
    const {
      name,
      phone,
      nickname,
      email,
      userId,
      unitName,
      buildingName,
      companyName
    } = req.body;

    // ➤ ตรวจสอบข้อมูลที่จำเป็น
    if (!unitName || !buildingName || !companyName) {
      return res.status(400).json({ message: 'กรุณาระบุ unitName, buildingName และ companyName ให้ครบถ้วน' });
    }

    // ➤ ตรวจสอบว่าลงทะเบียนไว้แล้วหรือยัง
    const existingCustomer = await prisma.customer.findUnique({ where: { userId } });
    if (existingCustomer) {
      return res.status(200).json({
        message: 'ผู้ใช้นี้ได้ลงทะเบียนไว้แล้ว',
        customer: existingCustomer
      });
    }

    // ➤ ค้นหาหรือสร้าง Building
    let building = await prisma.building.findFirst({
      where: { buildingName }
    });

    if (!building) {
      building = await prisma.building.create({
        data: { buildingName }
      });
    }

    // ➤ ค้นหาหรือสร้าง Company ภายใต้ Building
    let company = await prisma.company.findFirst({
      where: {
        companyName,
        buildingId: building.id
      }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          companyName,
          building: { connect: { id: building.id } }
        }
      });
    }

    // ➤ ค้นหาหรือสร้าง Unit ภายใต้ Company
    let unit = await prisma.units.findFirst({
      where: {
        unitName,
        companyId: company.id
      }
    });

    if (!unit) {
      unit = await prisma.units.create({
        data: {
          unitName,
          company: { connect: { id: company.id } }
        }
      });
    }

    // ➤ สร้าง Customer ใหม่
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone,
        nickname,
        email,
        userId,
        isDelete: true, // ตั้งค่าเริ่มต้นเป็น true เพื่อรอการอนุมัติ
        unit: { connect: { id: unit.id } }
      }
    });

    res.status(201).json({
      message: 'ลงทะเบียนเรียบร้อยแล้ว',
      customer: newCustomer
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};


exports.registerWithPhone = async (req, res) => {
  try {
    const { phone, userId } = req.body;

    if (!phone || !userId) {
      return res.status(400).json({ message: "กรุณาระบุ phone และ userId" });
    }

    // 1. ตรวจใน Customer
    const customer = await prisma.customer.findFirst({
      where: {
        phone,
        userId: null
      }
    });

    if (customer) {
      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: { userId }
      });

      return res.status(200).json({
        message: 'เข้าสู่ระบบในฐานะลูกค้า',
        role: 'customer',
        user: updatedCustomer
      });
    }

    // 2. ถ้าไม่ใช่ลูกค้า → ตรวจใน Technician
    const technician = await prisma.technician.findFirst({
      where: {
        phone,
        userId: null
      }
    });

    if (technician) {
      const updatedTech = await prisma.technician.update({
        where: { id: technician.id },
        data: { userId }
      });

      // อัปเดต techBuild ที่ techId ยังเป็น null ด้วย userId
      await prisma.techBuild.updateMany({
        where: {
          techId: null
        },
        data: {
          techId: userId
        }
      });

      return res.status(200).json({
        message: 'เข้าสู่ระบบในฐานะช่าง',
        role: 'technician',
        user: updatedTech
      });
    }

    // 3. ถ้าไม่พบทั้งสอง → ถือว่าไม่อยู่ในระบบ
    return res.status(404).json({ message: "ไม่พบหมายเลขโทรศัพท์ในระบบ" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.approveCustomer = async (req, res) => {
  try {
    const { userId } = req.params
    const customer = await prisma.customer.update({
      where: { userId },
      data: { isDelete: false }
    })

    await sendLineNotify(userId, {
      type: 'text',
      text: 'การลงทะเบียนได้รับการอนุมัติแล้ว สามารถแจ้งซ่อมได้ที่เมนู'
    })
    res.json({ message: "Approve success", data: customer })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getCustomerWaitApprove = async (req, res) => {
  try {
    const customer = await prisma.customer.findMany({
      where: {
        isDelete: true
      },
      include: {
        unit: {
          include: {
            company: {
              include: {
                building: true
              }
            }
          }
        }
      },
    })
    res.json({ message: "Get customer wait for approve", data: customer })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body
    const admin = await prisma.admin.create({
      data: {
        username,
        password
      }
    })
    res.json({ message: "Create admin success", data: admin })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getAdmin = async (req, res) => {
  try {
    const admin = await prisma.admin.findMany()
    res.json({ message: "Get admin success", data: admin })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params
    const admin = await prisma.admin.findFirst({
      where: { id: Number(id) }
    })
    res.json({ message: "Get admin by id success", data: admin })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.updateAdmin = async (req, res) => {
  try {
    const { id, username, password } = req.body
    const admin = await prisma.admin.update({
      where: {
        id: Number(id)
      },
      data: {
        username,
        password
      }
    })
    res.json({ message: "Update username password success", data: admin })
  } catch (error) {
    console.log(error)
  }
}

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const admin = await prisma.admin.delete({
      where: {
        id: Number(id)
      }
    })
    res.json({ message: "Delete admin success", data: admin })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// exports.login = async (req, res) => {
//   try {
//     const { username, password } = req.body
//     if (!username || !password) {
//       return res.status(400).json({ message: "Username and password are required" })
//     }

//     const admin = await prisma.admin.findFirst({
//       where: { username: username }
//     })

//     if (!admin) {
//       return res.status(401).json({ message: "Invalid username" })
//     }

//     if (admin.password !== password) {
//       return res.status(401).json({ message: "Invalid password" })
//     }

//     const token = jwt.sign(
//       { id: admin.id, username: admin.username },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' })

//     return res.status(200).json({
//       message: "Login success",
//       token,
//       data: {
//         id: admin.id,
//         username: admin.username,
//         isDelete: admin.isDelete
//       }
//     })
//   } catch (error) {
//     console.log(error)
//     res.status(500).json({ message: "Server Error" })
//   }
// }

exports.login = async (req, res) => {
  try {
    // ---------- 1) Validate input ----------
    const { username, password, "cf-turnstile-response": captchaToken } = req.body;
    
    // const ip = req.headers.get("CF-Connecting-IP");
    // console.log("captchaToken in auth backend: ", captchaToken)
    // console.log("ip: ", ip)
    // const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" })
    }

    if (!captchaToken) {
      return res.status(400).json({ message: "Turnstile token is missing." });
    }

    // console.log("req.ip: ", req.ip);
    // console.log("process.env.TURNSTILE_SECRET_KEY: ", process.env.TURNSTILE_SECRET_KEY);
    // ---------- 2) Verify Turnstile token ----------
    

    const captchaVerify = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: captchaToken,
        // remoteip: ip, // optional
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 4000,
      }
    );

    console.log("captchaVerify.data: ", captchaVerify.data);
    // console.log("captchaVerify.data.success: ", captchaVerify.data?.success);
    if (!captchaVerify.data?.success) {
      return res.status(403).json({ message: "Turnstile verification failed." });
    }

    // ---------- 3) Find user ----------
    const admin = await prisma.admin.findFirst({
      where: { username: username }
    })

    if (!admin) {
      return res.status(401).json({ message: "Invalid username" })
    }

    // ---------- 4) Check password ----------
    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid password" })
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' })

    return res.status(200).json({
      message: "Login success",
      token,
      data: {
        id: admin?.id,
        username: admin?.username,
        isDelete: admin?.isDelete
        // captchaVerify: captchaToken
      }
    })

    // const outcome = await captchaVerify.json();
    // return res.send({username, outcome})

  } catch (error) {
    // console.log(error)
    console.error('Turnstile error:', error.response?.data);
    res.status(500).json({ message: "Server Error" })
  }
}