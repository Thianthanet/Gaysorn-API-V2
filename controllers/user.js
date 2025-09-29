const prisma = require('../config/prisma')

exports.createBuilding = async (req, res) => {
  try {
    const { buildingName, groupId } = req.body
    const building = await prisma.building.create({
      data: {
        buildingName,
        groupId
      }
    })
    res.json({ message: "Create building success", data: building })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.updateBuilding = async (req, res) => {
  try {
    const { id, groupId } = req.body
    const building = await prisma.building.update({
      where: { id: Number(id) },
      data: {
        groupId
      }
    })
    res.json({ message: "Update building success", data: building })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.createCompany = async (req, res) => {
  try {
    const { name, buildingId } = req.body

    if (!name || !buildingId) {
      return res.status(400).json({ message: "ชื่อและ buildingId จำเป็นต้องระบุ" })
    }

    // 🔍 ตรวจสอบก่อนว่าชื่อซ้ำไหม
    const existingCompany = await prisma.company.findFirst({
      where: {
        companyName: name.trim(),
        buildingId: Number(buildingId),
        isDelete: false
      }
    })

    if (existingCompany) {
      return res.status(400).json({ message: "มีบริษัทนี้ในระบบแล้วในอาคารนี้" })
    }

    // ✅ ถ้าไม่มีบริษัทนี้ใน building นี้ → สร้างใหม่
    const newCompany = await prisma.company.create({
      data: {
        companyName: name.trim(),
        building: {
          connect: { id: Number(buildingId) }
        }
      }
    })

    res.status(201).json({
      message: "Create company success",
      data: newCompany
    })
  } catch (error) {
    console.error("Create company error:", error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.createUnit = async (req, res) => {
  try {
    const { unitName, companyId } = req.body
    const newUnit = await prisma.units.create({
      data: {
        unitName,
        company: {
          connect: { id: companyId }
        }
      },
      include: {
        company: {
          include: {
            building: true
          }
        }
      }
    })
    res.json({ message: "Create units success", data: newUnit })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// exports.createCustomer = async (req, res) => {
//   try {
//     const {
//       name,
//       phone,
//       nickname,
//       email,
//       userId,
//       unitId,
//       unitName,
//       buildingId,
//       buildingName,
//       companyId,
//       companyName
//     } = req.body;

//     let finalCompanyId = companyId;
//     let finalBuildingId = buildingId;
//     let finalUnitId = unitId;

//     // ➤ ถ้าไม่มี companyId → สร้าง Company ใหม่
//     if (!finalCompanyId) {
//       if (!companyName) {
//         return res.status(400).json({ message: 'กรุณาระบุ companyName เพื่อสร้าง Company ใหม่' });
//       }

//       const newCompany = await prisma.company.create({
//         data: { companyName }
//       });

//       finalCompanyId = newCompany.id;
//     }

//     // ➤ ถ้าไม่มี buildingId → สร้าง Building ใหม่
//     if (!finalBuildingId) {
//       if (!buildingName) {
//         return res.status(400).json({ message: 'กรุณาระบุ buildingName เพื่อสร้าง Building ใหม่' });
//       }

//       const newBuilding = await prisma.building.create({
//         data: {
//           buildingName,
//           company: { connect: { id: finalCompanyId } }
//         }
//       });

//       finalBuildingId = newBuilding.id;
//     }

//     // ➤ ตรวจสอบ unit
//     if (!finalUnitId) {
//       // ไม่มี unitId → สร้างใหม่จาก unitName
//       if (!unitName) {
//         return res.status(400).json({ message: 'กรุณาระบุ unitName เพื่อสร้าง Unit ใหม่' });
//       }

//       const newUnit = await prisma.units.create({
//         data: {
//           unitName,
//           company: { connect: { id: finalCompanyId } }
//         }
//       });

//       finalUnitId = newUnit.id;
//     } else {
//       // มี unitId → ตรวจสอบว่ามีอยู่จริงไหม
//       const existingUnit = await prisma.units.findUnique({ where: { id: finalUnitId } });

//       if (!existingUnit) {
//         // ถ้าไม่เจอ unit ที่ระบุ → สร้างใหม่จาก unitName (ถ้ามี)
//         if (!unitName) {
//           return res.status(400).json({ message: 'Unit ไม่พบในระบบ และไม่มี unitName สำหรับสร้างใหม่' });
//         }

//         const newUnit = await prisma.units.create({
//           data: {
//             unitName,
//             company: { connect: { id: finalCompanyId } }
//           }
//         });

//         finalUnitId = newUnit.id;
//       }
//     }

//     // ➤ สร้าง Customer
//     const newCustomer = await prisma.customer.create({
//       data: {
//         name,
//         phone,
//         nickname,
//         email,
//         userId,
//         unit: { connect: { id: finalUnitId } }
//       }
//     });

//     res.status(201).json({
//       message: 'สร้างลูกค้าเรียบร้อยแล้ว',
//       customer: newCustomer
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
//   }
// };

exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      nickname,
      email,
      // userId,
      unitName,
<<<<<<< HEAD
      //  unitName: rawUnitName,
=======
    //  unitName: rawUnitName,
>>>>>>> 3e5c465aa1f60c5df90cf4e9e8cfe5c0ce1f22f0
      buildingName,
      companyName
    } = req.body;

    // ➤ เช็คข้อมูลที่จำเป็น
<<<<<<< HEAD
    if (!buildingName || !companyName) {
=======
    if ( !buildingName || !companyName) {
>>>>>>> 3e5c465aa1f60c5df90cf4e9e8cfe5c0ce1f22f0
      return res.status(400).json({ message: ' buildingName และ companyName ให้ครบถ้วน' });
    }

    // ➤ ถ้า unitName ว่าง ให้ตั้งเป็น '-'
<<<<<<< HEAD
    // const unitName = rawUnitName && rawUnitName.trim() !== '' ? rawUnitName : '-';
=======
   // const unitName = rawUnitName && rawUnitName.trim() !== '' ? rawUnitName : '-';
>>>>>>> 3e5c465aa1f60c5df90cf4e9e8cfe5c0ce1f22f0

    // ➤ หา building จากชื่อ หรือสร้างใหม่
    let building = await prisma.building.findFirst({
      where: { buildingName }
    });

    if (!building) {
      building = await prisma.building.create({
        data: { buildingName }
      });
    }

    // ➤ หา company จากชื่อ + buildingId หรือสร้างใหม่
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


    // ➤ หา unit จากชื่อ + companyId หรือสร้างใหม่
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

<<<<<<< HEAD
    //  let unit = null;
    //  if (unitName !== '-') {
    // ➤ หา unit จากชื่อ + companyId หรือสร้างใหม่
    //   unit = await prisma.units.findFirst({
    //     where: { unitName, companyId: company.id }
    //   });
    //  if (!unit) {
    //   unit = await prisma.units.create({
    //     data: { unitName, company: { connect: { id: company.id } } }
    //   });
    //   }
    // }

    // ➤ เช็คว่าลูกค้าเบอร์นี้ลงทะเบียนแล้วหรือยัง
    //    const existingCustomer = await prisma.customer.findUnique({ where: { phone } });
    //  if (existingCustomer) {
    //   return res.status(200).json({
    //     message: 'เบอร์โทรนี้ได้ลงทะเบียนไว้แล้ว',
    //     customer: existingCustomer
    //    });
    //   }
=======
 //  let unit = null;
  //  if (unitName !== '-') {
      // ➤ หา unit จากชื่อ + companyId หรือสร้างใหม่
   //   unit = await prisma.units.findFirst({
   //     where: { unitName, companyId: company.id }
   //   });
    //  if (!unit) {
     //   unit = await prisma.units.create({
     //     data: { unitName, company: { connect: { id: company.id } } }
     //   });
   //   }
   // }

    // ➤ เช็คว่าลูกค้าเบอร์นี้ลงทะเบียนแล้วหรือยัง
//    const existingCustomer = await prisma.customer.findUnique({ where: { phone } });
  //  if (existingCustomer) {
   //   return res.status(200).json({
   //     message: 'เบอร์โทรนี้ได้ลงทะเบียนไว้แล้ว',
   //     customer: existingCustomer
  //    });
 //   }
>>>>>>> 3e5c465aa1f60c5df90cf4e9e8cfe5c0ce1f22f0

    // ➤ สร้างลูกค้าใหม่
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone,
        nickname,
        email,
        // userId,
        unit: { connect: { id: unit.id } }
<<<<<<< HEAD
        // ...(unit ? { unit: { connect: { id: unit.id } } } : {})
=======
     // ...(unit ? { unit: { connect: { id: unit.id } } } : {})
>>>>>>> 3e5c465aa1f60c5df90cf4e9e8cfe5c0ce1f22f0
      }
    });

    res.status(201).json({
      message: 'สร้างลูกค้าเรียบร้อยแล้ว',
      customer: newCustomer
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};


exports.createTechnician = async (req, res) => {
  try {
    const { name, phone } = req.body
    // buildingIds 

    // if (!Array.isArray(buildingIds) || buildingIds.length === 0) {
    //   return res.status(400).json({ message: "buildingIds is required and must be a non-empty array" })
    // }

    const existingTech = await prisma.technician.findUnique({
      where: { phone }
    })

    if (existingTech) {
      return res.status(400).json({ message: "เบอร์นี้ถูกใช้งานแล้ว" })
    }

    const newTech = await prisma.technician.create({
      data: {
        name,
        phone
      }
    })

    // const techBuildData = buildingIds.map((buildingId) => ({
    //   techId: newTech.userId,
    //   buildingId
    // }))

    // await prisma.techBuild.createMany({
    //   data: techBuildData,
    //   skipDuplicates: true
    // })

    res.json({ message: "Create technician success", data: newTech })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}


exports.deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params
    const technician = await prisma.technician.delete({
      where: { id: Number(id) }
    })
    res.json({ message: "Delete technician success", data: technician })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getBuilding = async (req, res) => {
  try {
    const building = await prisma.building.findMany()
    res.json({ message: "Get building success", data: building })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getCompany = async (req, res) => {
  try {
    const company = await prisma.company.findMany()
    res.json({ message: "Get company success", data: company })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getUnits = async (req, res) => {
  try {
    const units = await prisma.units.findMany()
    res.json({ message: "Get units success", data: units })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params
    const customer = await prisma.customer.findFirst({
      where: { userId }
    })

    if (customer) {
      // นับจำนวน Repair ของลูกค้าคนนี้
      const repairCount = await prisma.repair.count({
        where: {
          customerUserId: userId
        }
      })

      return res.status(200).json({
        role: "customer",
        data: {
          ...customer,
          repairCount: repairCount // แนบจำนวนงานแจ้งซ่อมไปด้วย
        }
      })
    }

    const technician = await prisma.technician.findFirst({
      where: { userId },
      include: {
        techBuilds: {
          include: {
            building: true
          }
        }
      }
    })

    if (technician) {
      return res.status(200).json({ role: "technician", data: technician })
    }

    return res.status(404).json({ message: "User not found" })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getUBC = async (req, res) => {
  try {
    const { unitId } = req.params
    const unit = await prisma.units.findFirst({
      where: { id: Number(unitId) },
      include: {
        company: {
          include: {
            building: true
          }
        }
      }
    })
    const company = unit.company
    const building = unit.company.building
    res.json({ message: "Get UBC success", unit, company, building })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getTechnician = async (req, res) => {
  try {
    const technician = await prisma.technician.findMany({
      include: {
        techBuilds: {
          include: {
            building: true
          }
        }
      }
    })
    res.json({ message: "Get technician success", data: technician })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.allCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.findMany({
      where: {
        isDelete: false,
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
      }
    })
    res.json({ message: "Get all customer", data: customer })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params
    const customer = await prisma.customer.delete({
      where: { id: Number(id) }
    })
    res.json({ message: "Delete customer success", data: customer })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params
    const customer = await prisma.customer.findFirst({
      where: { id: Number(id) },
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
      }
    })
    res.json({ message: "Get customer by id success", data: customer })
  } catch (error) {
    console.log(error)
  }
}


exports.techUpdateBuilding = async (req, res) => {
  try {
    const { techId, buildingIds } = req.body;

    if (!techId || !Array.isArray(buildingIds) || buildingIds.length === 0) {
      return res.status(400).json({ message: "techId and buildingIds[] are required" });
    }

    // 1) ลบข้อมูลเดิมทั้งหมดที่เคยผูกไว้กับ techId นี้
    await prisma.techBuild.deleteMany({
      where: { techId: techId },
    });

    // 2) เพิ่มใหม่ทั้งหมด
    const results = await Promise.all(
      buildingIds.map(async (buildingId) => {
        return await prisma.techBuild.create({
          data: {
            techId: techId,
            buildingId: buildingId,
          },
        });
      })
    );

    res.status(200).json({
      message: "Technician successfully linked to buildings",
      data: results,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const {
      id,
      name,
      phone,
      email,
      buildingId,
      companyId,
      companyName,
      unitId,
      unitName,
    } = req.body;

    // หา Customer เดิม
    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
      include: {
        unit: {
          include: {
            company: {
              include: { building: true },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;

    // จัดการ Building
    let building = null;
    if (buildingId) {
      building = await prisma.building.findUnique({
        where: { id: Number(buildingId) },
      });
      if (!building) {
        return res.status(404).json({ message: "Building not found" });
      }
    } else {
      // ใช้ building เดิมของลูกค้า
      building = await prisma.building.findUnique({
        where: { id: customer.unit.company.buildingId },
      });
    }

    // จัดการ Company
    let company = null;
    if (companyName) {
      // หา Company ชื่อเดียวกันใน Building นี้
      company = await prisma.company.findFirst({
        where: {
          companyName: companyName,
          buildingId: building.id,
        },
      });

      if (!company) {
        // สร้าง Company ใหม่
        company = await prisma.company.create({
          data: {
            companyName,
            buildingId: building.id,
          },
        });
      }
    } else if (companyId) {
      company = await prisma.company.findUnique({
        where: { id: Number(companyId) },
      });
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
    } else {
      // ใช้ company เดิม
      company = await prisma.company.findUnique({
        where: { id: customer.unit.companyId },
      });
      if (!company) {
        return res.status(404).json({ message: "Customer's company not found" });
      }
    }

    // จัดการ Unit
    let unit = null;
    if (unitId) {
      unit = await prisma.units.findUnique({
        where: { id: Number(unitId) },
      });
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
    } else if (unitName) {
      unit = await prisma.units.findFirst({
        where: {
          companyId: company.id,
          unitName: unitName,
        },
      });

      if (!unit) {
        // สร้าง Unit ใหม่
        unit = await prisma.units.create({
          data: {
            unitName,
            companyId: company.id,
          },
        });
      }
    } else {
      // ใช้ unit เดิม
      unit = await prisma.units.findUnique({
        where: { id: customer.unitId },
      });
      if (!unit) {
        return res.status(404).json({ message: "Customer's unit not found" });
      }
    }

    updateData.unitId = unit.id;

    // อัปเดต Customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        unit: {
          include: {
            company: {
              include: { building: true },
            },
          },
        },
      },
    });

    res.status(200).json({ message: "Customer updated successfully", customer: updatedCustomer });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateTechnician = async (req, res) => {
  try {
    const { id, name, phone } = req.body
    const technician = await prisma.technician.update({
      where: { id: Number(id) },
      data: {
        name,
        phone,
      }
    })
    res.json({ message: "Update technicina success", data: technician })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.removeTechBuild = async (req, res) => {
  try {
    const { techId, buildingId } = req.body
    if (!techId || !buildingId) {
      return res.status(400).json({ message: "techId และ buildingId ต้องระบุ" })
    }

    const techBuild = await prisma.techBuild.deleteMany({
      where: {
        techId,
        buildingId: Number(buildingId)
      }
    })
    res.json({ message: "Delete techbuild success", data: techBuild })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.getTechnicianId = async (req, res) => {
  try {
    const { id } = req.params
    const technician = await prisma.technician.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        techBuilds: {
          include: {
            building: true
          }
        }
      }
    })
    res.json({ message: "Get technician by id success", data: technician })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

