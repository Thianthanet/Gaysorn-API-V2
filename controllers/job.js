const { UploadBy } = require('@prisma/client')
const prisma = require('../config/prisma')
const moment = require('moment-timezone')
moment.tz.setDefault("Asia/Bangkok")
const { sendLineNotify } = require('../utils/line')
const { connect, route } = require('../routes/user')
require('dotenv').config()

// const generateJobNo = async () => {
//     const now = new Date()
//     const year = now.getFullYear()
//     const month = String(now.getMonth() + 1).padStart(2, '0')

//     const prefix = `${year}${month}` // ✅ ต้องกำหนด prefix ก่อนใช้

//     const lastJob = await prisma.repair.findFirst({
//         where: {
//             jobNo: {
//                 startsWith: prefix
//             }
//         },
//         orderBy: {
//             jobNo: 'desc'
//         }
//     })

//     let count = 1
//     if (lastJob) {
//         const lastSeq = parseInt(lastJob.jobNo.slice(-4))
//         count = lastSeq + 1
//     }

//     const newJobNo = `${prefix}${String(count).padStart(4, '0')}`
//     return newJobNo
// }

// const generateJobNo = async (buildingName) => {
//     const now = new Date();
//     const year = now.getFullYear().toString().slice(-2); // YY
//     const month = String(now.getMonth() + 1).padStart(2, '0'); // MM

//     let buildingPrefix = '';

//     if (buildingName.includes(' ')) {
//         const parts = buildingName.trim().split(/\s+/);
//         buildingPrefix = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//     } else {
//         buildingPrefix = buildingName.trim()[0].toUpperCase();
//     }

//     const ymPrefix = `${year}${month}`; // YYMM

//     // ✅ ดึงงานล่าสุด โดยดูเฉพาะ YYMM ส่วนตัวอักษรไม่สนใจ
//     const lastJob = await prisma.repair.findFirst({
//         where: {
//             jobNo: {
//                 contains: ymPrefix // ใช้ contains เพราะอักษรหน้าอาจเปลี่ยน
//             }
//         },
//         orderBy: {
//             jobNo: 'desc'
//         }
//     });

//     let count = 1;
//     if (lastJob) {
//         const lastSeq = parseInt(lastJob.jobNo.slice(-4));
//         count = lastSeq + 1;
//     }

//     const newJobNo = `${buildingPrefix}${ymPrefix}${String(count).padStart(4, '0')}`;
//     return newJobNo;
// };

// const generateJobNo = async (buildingName) => {
//     const now = new Date();
//     const year = now.getFullYear().toString().slice(-2); // YY
//     const month = String(now.getMonth() + 1).padStart(2, '0'); // MM
//     const ymPrefix = `${year}${month}`; // YYMM

//     // ✅ สร้าง buildingPrefix (เช่น GA)
//     let buildingPrefix = '';
//     if (buildingName.includes(' ')) {
//         const parts = buildingName.trim().split(/\s+/);
//         buildingPrefix = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//     } else {
//         buildingPrefix = buildingName.trim()[0].toUpperCase();
//     }

//     // ✅ หางานล่าสุดที่ตรง YYMM ไม่สน prefix ด้านหน้า
//     const lastJob = await prisma.repair.findFirst({
//         where: {
//             jobNo: {
//                 contains: ymPrefix, // หาเลขที่มี YYMM อยู่ตรงกลาง
//             },
//         },
//         orderBy: {
//             jobNo: 'desc',
//         },
//     });

//     let count = 1;

//     if (lastJob) {
//         const lastSeq = parseInt(lastJob.jobNo.slice(-4)); // ดึง 4 ตัวท้าย
//         count = lastSeq + 1;
//     }

//     const newJobNo = `${buildingPrefix}${ymPrefix}${String(count).padStart(4, '0')}`;
//     return newJobNo;
// };

// const generateJobNo = async (buildingName) => {
//   const now = new Date();
//   const year = now.getFullYear().toString().slice(-2); // YY
//   const month = String(now.getMonth() + 1).padStart(2, '0'); // MM
//   const ymPrefix = `${year}${month}`; // เช่น 2507

//   // ✅ สร้าง prefix ตึก เช่น GA, GT, BA
//   let buildingPrefix = '';
//   if (buildingName.includes(' ')) {
//     const parts = buildingName.trim().split(/\s+/);
//     buildingPrefix = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//   } else {
//     buildingPrefix = buildingName.trim().slice(0, 2).toUpperCase();
//   }

//   // ✅ ดึงงานทั้งหมดที่มี YYMM ตรงกลาง (เช่น 2507)
//   const jobsInMonth = await prisma.repair.findMany({
//     where: {
//       jobNo: {
//         contains: ymPrefix,
//       },
//     },
//     orderBy: {
//       jobNo: 'desc',
//     },
//   });

const generateJobNo = async (buildingName) => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // YY
    const month = String(now.getMonth() + 1).padStart(2, '0'); // MM
    const ymPrefix = `${year}${month}`; // เช่น 2507

    // ✅ สร้าง building prefix เช่น GA
    let buildingPrefix = '';
    if (buildingName.includes(' ')) {
        const parts = buildingName.trim().split(/\s+/);
        buildingPrefix = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else {
        buildingPrefix = buildingName.trim().slice(0, 2).toUpperCase();
    }

    // ✅ ดึงงานทั้งหมดในเดือนนี้ (ระบุแค่ contains YYMM)
    const jobsInMonth = await prisma.repair.findMany({
        where: {
            jobNo: {
                contains: ymPrefix,
            },
        },
    });

    // ✅ หาเลขท้ายสุดในเดือนนี้แบบปลอดภัย
    let maxSeq = 0;

    for (const job of jobsInMonth) {
        const jobNo = job.jobNo;
        // ตรวจสอบความยาวและรูปแบบก่อน
        if (jobNo.length >= 10 && jobNo.slice(2, 6) === ymPrefix) {
            const seqStr = jobNo.slice(-4);
            const seq = parseInt(seqStr);
            if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
            }
        }
    }

    const newSeq = maxSeq + 1;
    const newJobNo = `${buildingPrefix}${ymPrefix}${String(newSeq).padStart(4, '0')}`;

    // ✅ DEBUG
    console.log("Max sequence found:", maxSeq);
    console.log("New job number:", newJobNo);

    return newJobNo;
};

//   // ✅ กรองเฉพาะ jobNo ที่ตรงรูปแบบและยาวพอ
//   const filteredJobs = jobsInMonth.filter(job =>
//     job.jobNo.length >= 10 &&
//     job.jobNo.slice(2, 6) === ymPrefix &&
//     /^\d{4}$/.test(job.jobNo.slice(-4))
//   );

//   let count = 1;
//   if (filteredJobs.length > 0) {
//     const lastSeq = parseInt(filteredJobs[0].jobNo.slice(-4));
//     count = lastSeq + 1;
//   }

//   const newJobNo = `${buildingPrefix}${ymPrefix}${String(count).padStart(4, '0')}`;

//   // ✅ DEBUG
//   console.log("Last job:", filteredJobs[0]?.jobNo);
//   console.log("New jobNo:", newJobNo);

//   return newJobNo;
// };


exports.createRepair = async (req, res) => {
    try {
        const {
            customerUserId,
            ownerId,
            unitId,
            detail,
            choiceDesc,
            preworkDate
            // choices = [],
        } = req.body

        console.log("customerUserId", customerUserId)

        const rawChoices = req.body.choices
        const choices = Array.isArray(rawChoices)
            ? rawChoices
            : rawChoices
                ? [rawChoices]
                : []
        const protocol = req.headers['x-forwarded-proto'] || req.protocol
        const images = (req.files || []).map(file => {
            return `${protocol}://${req.get('host')}/uploads/${file.filename}`
        })

        let parsedPreworkDate = null
        if (preworkDate) {
            parsedPreworkDate = new Date(preworkDate)
            if (isNaN(parsedPreworkDate.getTime())) {
                return res.status(400).json({ message: "รูปแบบวันที่นัดหมายไม่ถูกต้อง" })
            }
        }

        // const newJobNo = await generateJobNo()

        // 🔍 ดึงข้อมูล Unit พร้อม Company และ Building
        const unit = await prisma.units.findUnique({
            where: { id: Number(unitId) },
            include: {
                company: {
                    include: {
                        building: true
                    }
                }
            }
        })

        if (!unit || !unit.company || !unit.company.building) {
            return res.status(400).json({ message: "ไม่พบข้อมูลหน่วย, บริษัท หรืออาคาร" })
        }

        const company = unit.company
        const building = company.building

        const newJobNo = await generateJobNo(building.buildingName)

        const customer = await prisma.customer.findUnique({
            where: { userId: customerUserId }
        })

        let choiceDescription = ""
        const choiceConnects = []
        if (Array.isArray(choices) && choices.length > 0) {
            for (const choiceName of choices) {
                let existing = await prisma.repairChoice.findFirst({
                    where: {
                        choiceName: choiceName.trim()
                    }
                })

                if (!existing) {
                    existing = await prisma.repairChoice.create({
                        data: {
                            choiceName: choiceName.trim()
                        }
                    })
                }
                choiceDescription += (choiceDescription ? ", " : "") + existing.choiceName
                choiceConnects.push({
                    repairChoice: { connect: { id: existing.id } }
                })
            }
        }

        if (choiceDesc && choiceDesc.trim() !== "") {
            choiceDescription += (choiceDescription ? ", " : "") + choiceDesc.trim()
        }

        const newRepair = await prisma.repair.create({
            data: {
                jobNo: newJobNo,
                customerUserId,
                ownerId,
                unitId: parseInt(unitId),
                companyId: company.id,
                buildingId: building.id,
                detail,
                choiceDesc: choiceDescription,
                preworkDate: parsedPreworkDate,
                status: "pending",
                choices: {
                    create: choiceConnects
                },
                images: {
                    create: images.map(url => ({
                        url,
                        uploadBy: "cus",
                        mark: "cusRepair"
                    }))
                }
            },
            include: {
                building: true,
                customer: true,
                images: true
            }
        })

        const m = moment();
        const day = m.format("D");
        const month = m.format("MMM");
        const year = (m.year() + 543).toString().slice(-2);
        const time = m.format("HH:mm");

        const jobTime = `${day} ${month} ${year} เวลา ${time} น.`;

        const repairWebUrl = `${process.env.WEB_BASE_URL}/accept-repair/${newRepair.id}`

        const messageToGroup = {
            type: "flex",
            altText: "📋 แจ้งงานซ่อมใหม่",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "งานใหม่", weight: "bold", size: "lg", color: "#837958" },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `หมายเลขงาน :`, size: "sm", flex: 2 },
                                { type: "text", text: `${newJobNo}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${jobTime}`, size: "sm", flex: 4 },
                            ]
                        },
                        ...(parsedPreworkDate ? [
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    { type: "text", text: `วันที่นัดหมาย:`, size: "sm", flex: 2 },
                                    {
                                        type: "text", text: `${moment(parsedPreworkDate)
                                            .locale("th")
                                            .add(543, "year")
                                            .format("D MMM")} ${moment(parsedPreworkDate).locale("th").format("YYYY").slice(-2)} เวลา ${moment(parsedPreworkDate).format("HH:mm")} น.`, size: "sm", flex: 4
                                    }
                                ]
                            }
                        ] : []),
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `บริษัท :`, size: "sm", flex: 2 },
                                { type: "text", text: `${company.companyName}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `สถานที่ :`, size: "sm", flex: 2 },
                                { type: "text", text: `${building.buildingName}, ${unit.unitName}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        // {
                        //     type: "box",
                        //     layout: "baseline",
                        //     contents: [
                        //         { type: "text", text: `สถานที่ :`, size: "sm", flex: 2 },
                        //         { type: "text", text: `${unit.unitName}`, size: "sm", wrap: true, flex: 4 },
                        //     ]
                        // },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `ผู้แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${customer.name} (${customer.phone})`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `กลุ่มงาน :`, size: "sm", flex: 2 },
                                { type: "text", text: `${choiceDescription}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `รายละเอียด :`, size: "sm", flex: 2 },
                                { type: "text", text: `${detail}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `สถานะ :`, size: "sm", color: "#FF0000", weight: "bold", flex: 2 },
                                { type: "text", text: `รอดำเนินการ`, size: "sm", wrap: true, color: "#FF0000", weight: "bold", flex: 4 },
                            ]
                        },

                        // ✅ แสดงเฉพาะเมื่อมีรูป
                        ...(images.length > 0
                            ? images.map(url => ({
                                type: "image",
                                url: url,
                                size: "full",
                                aspectRatio: "16:9",
                                aspectMode: "cover",
                                margin: "md"
                            }))
                            : [])
                    ]
                },
                // footer: {
                //     type: "box",
                //     layout: "vertical",
                //     spacing: "sm",
                //     contents: [
                //         {
                //             type: "button",
                //             style: "primary",
                //             action: {
                //                 type: "uri",
                //                 label: "เปิดดูและรับงาน",
                //                 uri: repairWebUrl
                //             }
                //         }
                //     ]
                // }
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            height: "sm",
                            // color: "#F4F2ED",
                            action: {
                                type: "uri",
                                label: "รายละเอียด",
                                uri: repairWebUrl
                            },
                            // "color": "#FFFFFF",          // พื้นหลังโปร่งใส
                            // "margin": "md"
                            // "borderWidth": "1px",
                            // "borderColor": "837958"
                        }
                    ],
                    flex: 0
                }
            }
        }

        const messageToCustomer = {
            type: "flex",
            altText: "📋 แจ้งซ่อม",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "การแจ้งซ่อมสำเร็จ", weight: "bold", size: "lg", color: "#837958" },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `หมายเลขงาน :`, size: "sm", flex: 0 },
                                { type: "text", text: `${newJobNo}`, size: "sm", wrap: true, flex: 1 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${jobTime}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        ...(parsedPreworkDate ? [
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    { type: "text", text: `วันนัดเข้าซ่อม:`, size: "sm", flex: 2 },
                                    {
                                        type: "text", text: `${moment(parsedPreworkDate)
                                            .locale("th")
                                            .add(543, "year")
                                            .format("D MMM")} ${moment(parsedPreworkDate).locale("th").format("YYYY").slice(-2)} เวลา ${moment(parsedPreworkDate).format("HH:mm")} น.`, size: "sm", flex: 4
                                    }
                                ]
                            }
                        ] : []),
                        // {
                        //     type: "box",
                        //     layout: "baseline",
                        //     contents: [
                        //         { type: "text", text: `บริษัท :`, size: "sm", flex: 2 },
                        //         { type: "text", text: `${company.companyName}`, size: "sm", wrap: true, flex: 4 },
                        //     ]
                        // },
                        // { type: "text", text: `อาคาร: ${building.buildingName}`, size: "sm", wrap: true },
                        // { type: "text", text: `สถานที่: ${unit.unitName}`, size: "sm", wrap: true },
                        // { type: "text", text: `ผู้แจ้ง: ${customer.name}`, size: "sm", wrap: true },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `กลุ่มงาน :`, size: "sm", flex: 2 },
                                { type: "text", text: `${choiceDescription}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `รายละเอียด :`, size: "sm", flex: 2 },
                                { type: "text", text: `${detail}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `สถานะ :`, size: "sm", color: "#FF0000", weight: "bold", flex: 2 },
                                { type: "text", text: `รอดำเนินการ`, size: "sm", wrap: true, color: "#FF0000", weight: "bold", flex: 4 },
                            ]
                        },


                        ...(images.length > 0
                            ? images.map(url => ({
                                type: "image",
                                url: url,
                                size: "full",
                                aspectRatio: "16:9",
                                aspectMode: "cover",
                                margin: "md"
                            }))
                            : [])
                    ]
                }
            }
        }

        if (building.groupId) {
            await sendLineNotify(building.groupId, messageToGroup)
        }

        if (customerUserId) {
            await sendLineNotify(customerUserId, messageToCustomer)
        }

        return res.json({ message: "แจ้งซ่อมสำเร็จ", data: newRepair })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

exports.createRepairChoice = async (req, res) => {
    try {
        const { choiceName } = req.body
        const newChoice = await prisma.repairChoice.create({
            data: {
                choiceName
            }
        })
        res.json({ message: "Add choice success", data: newChoice })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getChoices = async (req, res) => {
    try {
        const choices = await prisma.repairChoice.findMany()
        res.json({ message: "Get choice success", data: choices })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.updateChoice = async (req, res) => {
    try {
        const { id, choiceName } = req.body
        const choices = await prisma.repairChoice.update({
            where: {
                id: Number(id)
            },
            data: {
                choiceName,
            }
        })
        res.json({ message: "Update choices success", data: choices })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.useChoices = async (req, res) => {
    try {
        const { id, isDelete } = req.body
        const choices = await prisma.repairChoice.update({
            where: {
                id: Number(id)
            },
            data: {
                isDelete: isDelete
            }
        })
        res.json({ message: "Update choices success", data: choices })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getChoicesById = async (req, res) => {
    try {
        const { id } = req.params
        const choice = await prisma.repairChoice.findUnique({
            where: {
                id: Number(id)
            }
        })
        res.json({ message: "Get choice by Id success", data: choice })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.deleteChoiceFake = async (req, res) => {
    try {
        const { id } = req.params
        const choice = await prisma.repairChoice.update({
            where: {
                id: Number(id)
            },
            data: {
                isDelete: true,
                fakeDelete: true
            }
        })
        res.json({ message: "Delete Choice success", data: choice })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

// exports.getRepairById = async (req, res) => {
//     try {
//         const { id } = req.params

//         const repair = await prisma.repair.findFirst({
//             where: { id: Number(id) },
//             include: {
//                 unit: true,        // ✅ ดึงข้อมูล Units
//                 company: true,     // ✅ ดึงข้อมูล Company
//                 building: true,    // ✅ ดึงข้อมูล Building
//                 choices: {
//                     include: {
//                         repairChoice: true
//                     }
//                 },
//                 images: true
//             }
//         })

//         if (!repair) {
//             return res.status(404).json({ message: "Repair not found" })
//         }

//         const customer = await prisma.customer.findFirst({
//             where: {
//                 userId: repair.customerUserId || undefined
//             }
//         })

//         res.json({
//             ...repair,
//             customer: customer || null
//         })
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Server Error" })
//     }
// }

// exports.getRepairById = async (req, res) => {
//     try {
//         const { id } = req.params

//         const repair = await prisma.repair.findFirst({
//             where: { id: Number(id) },
//             include: {
//                 unit: true,
//                 company: true,
//                 building: true,
//                 choices: {
//                     include: {
//                         repairChoice: true
//                     }
//                 },
//                 images: true
//             }
//         })

//         if (!repair) {
//             return res.status(404).json({ message: "Repair not found" })
//         }

//         let customer = null

//         if (repair.customerUserId) {
//             customer = await prisma.customer.findFirst({
//                 where: {
//                     userId: repair.customerUserId
//                 }
//             })
//         }

//         res.json({
//             ...repair,
//             customer: customer || null
//         })
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Server Error" })
//     }
// }

exports.getRepairById = async (req, res) => {
  try {
    const { id } = req.params;

    const repair = await prisma.repair.findFirst({
      where: { id: Number(id) },
      include: {
        unit: true,
        company: true,
        building: true,
        choices: {
          include: {
            repairChoice: true
          }
        },
        images: true,

        // เพิ่มข้อมูลช่าง
        technician: true,   // ช่างที่รับมอบหมาย (technicianUserId)
        acceptedBy: true,   // ช่างที่กดรับงาน (techAcceptUserId)
        completedBy: true   // ช่างที่กดเสร็จงาน (techCompleteUserId)
      }
    });

    if (!repair) {
      return res.status(404).json({ message: "Repair not found" });
    }

    let customer = null;

    if (repair.customerUserId) {
      customer = await prisma.customer.findFirst({
        where: {
          userId: repair.customerUserId
        }
      });
    }

   let owner = null
   if (repair.ownerId) {
    owner = await prisma.customer.findFirst({
      where: { userId: repair.ownerId }
    })

   if (!owner) {
    owner = await prisma.technician.findFirst({
     where: { userId: repair.ownerId }  
    })
  }
  }

    res.json({
      ...repair,
      customer: customer || null,
      owner: owner ? { name: owner.name, phone: owner.phone  } : null
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
}



// exports.acceptRepair = async (req, res) => {
//     try {
//         const { id, technicianUserId, techAcceptUserId } = req.body

//         const existingRepair = await prisma.repair.findFirst({
//             where: { id: Number(id) }
//         })

//         if (!existingRepair) {
//             return res.status(404).json({ message: "ไม่พบงานที่ระบุ" })
//         }

//         if (existingRepair.status === "in_progress") {
//             return res.status(400).json({ message: "งานนี้อยู่ระหว่างดำเนินการ ไม่สามารถรับซ้ำได้" })
//         }

//         const technician = await prisma.technician.findFirst({
//             where: {
//                 userId: technicianUserId
//             }
//         })

//         const acceptDateTH = moment()
//             .tz("Asia/Bangkok")
//             .locale("th")
//             .format("D MMM YY HH:mm") + " น."
//         const acceptDate = new Date().toISOString();
//         const updateRepair = await prisma.repair.update({
//             where: { id: Number(id) },
//             data: {
//                 status: "in_progress",
//                 technicianUserId,
//                 techAcceptUserId,
//                 acceptDate: acceptDate
//             },
//             include: {
//                 customer: true,
//                 technician: true,
//                 acceptedBy: true,
//                 completedBy: true,
//                 company: {
//                     include: {
//                         building: true
//                     }
//                 }
//             }
//         })

//         const company = await prisma.company.findFirst({
//             where: { id: updateRepair.companyId }
//         })

//         const companyName = company?.companyName || "ไม่ทราบชื่อบริษัท"
//         const groupId = updateRepair.company?.building?.groupId

//         const flexMsgGroup = {
//             type: 'flex',
//             altText: `📢 หมายเลขงาน: ${updateRepair.jobNo} กำลังดำเนินการ`,
//             contents: {
//                 type: 'bubble',
//                 body: {
//                     type: 'box',
//                     layout: 'vertical',
//                     contents: [
//                         { type: "text", text: `หมายเลขงาน: ${updateRepair.jobNo}`, size: "lg", wrap: true },
//                         { type: "text", text: `เวลารับงาน: ${acceptDateTH}`, size: "sm", wrap: true },
//                         { type: "text", text: `บริษัท: ${companyName}`, size: "sm", wrap: true },
//                         { type: "text", text: `ผู้รับงาน: ${technician.name}`, size: "sm", wrap: true },
//                         { type: "text", text: `สถานะ: อยู่ระหว่างดำเนินการ`, size: "sm", wrap: true, color: "#F0B100" },
//                     ]
//                 }
//             }
//         }

//         const flexMsg = {
//             type: 'flex',
//             altText: `📢 หมายเลขงาน: ${updateRepair.jobNo} กำลังดำเนินการ`,
//             contents: {
//                 type: 'bubble',
//                 body: {
//                     type: 'box',
//                     layout: 'vertical',
//                     contents: [
//                         { type: "text", text: `หมายเลขงาน: ${updateRepair.jobNo}`, size: "lg", wrap: true },
//                         { type: "text", text: `เวลารับงาน: ${acceptDateTH}`, size: "sm", wrap: true },
//                         { type: "text", text: `บริษัท: ${companyName}`, size: "sm", wrap: true },
//                         { type: "text", text: `ผู้รับงาน: ${technician.name}`, size: "sm", wrap: true },
//                         { type: "text", text: `สถานะ: อยู่ระหว่างดำเนินการ`, size: "sm", wrap: true, color: "#F0B100" },
//                     ]
//                 }
//             }
//         }

//         await sendLineNotify(updateRepair.customerUserId, flexMsg)
//         await sendLineNotify(groupId, flexMsgGroup)

//         res.json({ message: "Accept repair successfully", data: updateRepair })
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Server Error" })
//     }
// }

// exports.getAllRepair = async (req, res) => {
//     try {
//         const repair = await prisma.repair.findMany({
//             include: {
//                 unit: true,
//                 company: true,
//                 building: true,
//                 customer: true
//             }
//         })
//         res.json({ message: "Get all repair success", data: repair })
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Server Error" })
//     }
// }

// exports.getAllRepair = async (req, res) => {
//     try {
//         // รับค่าจาก query parameter เช่น ?startDate=2025-07-01&endDate=2025-07-03
//         const { startDate, endDate } = req.query

//         // สร้าง where เงื่อนไข
//         let where = {}

//         if (startDate && endDate) {
//             const startDateTime = moment.tz(startDate, 'Asia/Bangkok').startOf('day').toDate()
//             const endDateTime = moment.tz(endDate, 'Asia/Bangkok').endOf('day').toDate()

//             where.createdAt = {
//                 gte: new Date(startDateTime), // greater than or equal
//                 lte: new Date(endDateTime)    // less than or equal
//             }
//         }

//         const repair = await prisma.repair.findMany({
//             where,
//             include: {
//                 unit: true,
//                 company: true,
//                 building: true,
//                 customer: true
//             }
//         })

//         res.json({ message: "Get all repair success", data: repair })
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Server Error" })
//     }
// }

exports.getAllRepair = async (req, res) => {
    try {
        const { startDate, endDate } = req.query

        // Where เงื่อนไขช่วงวันที่
        let where = {}

        if (startDate && endDate) {
            const startDateTime = moment.tz(startDate, 'Asia/Bangkok').startOf('day').toDate()
            const endDateTime = moment.tz(endDate, 'Asia/Bangkok').endOf('day').toDate()

            where.createDate = {
                gte: startDateTime,
                lte: endDateTime
            }
        }

        const repair = await prisma.repair.findMany({
            where,
            include: {
                unit: true,
                company: true,
                building: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        userId: true
                    }
                },
                // ช่างที่รับงาน
                acceptedBy: {
                    select: {
                        id: true,
                        name: true,
                        userId: true
                    }
                },
                // ช่างที่จบงาน
                completedBy: {
                    select: {
                        id: true,
                        name: true,
                        userId: true
                    }
                }
            },
            orderBy: {
                createDate: 'desc'
            }
        })

        // เติมข้อมูล owner
      const repairWithOwner = await Promise.all(
      repair.map(async r => {
      let owner = null
       if (r.ownerId) {
         owner = await prisma.customer.findUnique({
          where: { userId: r.ownerId },
          select: { id: true, name: true, phone: true, userId: true }
        })
         if (!owner) {
            owner = await prisma.technician.findUnique({
            where: { userId: r.ownerId },
            select: { id: true, name: true, phone: true, userId: true }
          })
        }
      }
      return { ...r, owner }
    })
  )

        res.json({
            message: "Get all repair success",
            data: repairWithOwner
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server Error" })
    }
}


exports.getRepairByTechnician = async (req, res) => {
    try {
        const { userId } = req.params
        const techBuids = await prisma.techBuild.findMany({
            where: {
                techId: userId
            },
            select: { buildingId: true }
        })

        const buildingIds = techBuids.map(tb => tb.buildingId)
        if (buildingIds.length === 0) {
            return res.json({ message: "ช่างยังไม่ได้ถูกผูกกับตึก", repairs: [] })
        }

        const repairs = await prisma.repair.findMany({
            where: {
                buildingId: { in: buildingIds }
            },
            include: {
                building: true,
                company: true,
                unit: true,
                customer: true,
                choices: {
                    include: { repairChoice: true }
                },
                images: route,
                technician: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                },
                acceptedBy: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                },
                completedBy: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                createDate: 'desc'
            },
        })
        
        // ✅ หา owner จาก ownerId ในแต่ละใบงาน
        const repairsWithOwner = await Promise.all(
            repairs.map(async (repair) => {
                let owner = null

                if (repair.ownerId) {
                    // หาใน customer ก่อน
                    owner = await prisma.customer.findUnique({
                        where: { userId: repair.ownerId },
                        select: { id: true, name: true, phone: true }
                    })

                    // ถ้าไม่เจอใน customer ไปหาใน technician
                    if (!owner) {
                        owner = await prisma.technician.findUnique({
                            where: { userId: repair.ownerId },
                            select: { id: true, name: true, phone: true }
                        })
                    }
                }

                return { 
                    ...repair, 
                    owner // ✅ แนบเจ้าของใบงานไปด้วย
                }
            })
        ) 
        
        res.json({ message: "Get repair by techbuild success", data: repairsWithOwner })	
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getCustomerRepair = async (req, res) => {
    try {
        const { userId } = req.params
        const customer = await prisma.repair.findMany({
            where: {
                ownerId: userId
            },
            include: {
                unit: true,
                company: true,
                building: true,
                customer: true
            }
        })
        res.json({ message: "Get history repair success", data: customer })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getAllCustomerRepairByCompany = async (req, res) => {
    try {
        const { userId } = req.params
        const customer = await prisma.customer.findFirst({
            where: { userId },
            include: {
                unit: true
            }
        })

        const companyId = customer.unit.companyId

        const repairs = await prisma.repair.findMany({
            where: {
                companyId: companyId,
            },
            include: {
                customer: true,
                unit: true,
                company: true,
                building: true,
                images: true,
                technician: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                },
                acceptedBy: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                },
                completedBy: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                createDate: 'desc'
            }
        })

        // ✅ หา owner จากตาราง Customer หรือ Technician
      const repairsWithOwner = await Promise.all(
        repairs.map(async (repair) => {
          if (!repair.ownerId) return { ...repair, owner: null }

          // หา owner จาก customer ก่อน
          let owner = await prisma.customer.findUnique({
            where: { userId: repair.ownerId },
            select: { id: true, name: true, phone: true }
          })

          if (!owner) {
            // ถ้าไม่เจอใน customer ลองหาใน technician
            owner = await prisma.technician.findUnique({
              where: { userId: repair.ownerId },
             select: { id: true, name: true, phone: true }
           })
         }

          return {
            ...repair,
            owner
          }
        })
       )
        
        res.json({ message: "Get repair by company success", data: repairsWithOwner })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

// exports.getCompanyRepairCount = async (req, res) => {
//     try {
//         // 1. groupBy companyId และ buildingId (ตัด unitId ออก)
//         const grouped = await prisma.repair.groupBy({
//             by: ['companyId', 'buildingId'],
//             where: {
//                 isDraft: false,
//             },
//             _count: {
//                 _all: true,
//             },
//         });

//         // 2. ดึง Company และ Building ที่เกี่ยวข้อง
//         const companyIds = [...new Set(grouped.map(item => item.companyId))];
//         const buildingIds = [...new Set(grouped.map(item => item.buildingId))];

//         const companies = await prisma.company.findMany({
//             where: { id: { in: companyIds } },
//             select: { id: true, companyName: true, buildingId: true },
//         });

//         const buildings = await prisma.building.findMany({
//             where: { id: { in: buildingIds } },
//             select: { id: true, buildingName: true },
//         });

//         // 3. รวมข้อมูลและส่งผล
//         const result = grouped.map(item => {
//             const company = companies.find(c => c.id === item.companyId);
//             const building = buildings.find(b => b.id === item.buildingId);
//             return {
//                 companyId: item.companyId,
//                 companyName: company?.companyName ?? null,
//                 buildingId: item.buildingId,
//                 buildingName: building?.buildingName ?? null,
//                 repairCount: item._count._all,
//             };
//         });

//         res.json({
//             message: "Get company repair count grouped by company and building",
//             data: result,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server Error" });
//     }
// };

// exports.getCompanyRepairCount = async (req, res) => {
//     try {
//         const { startDate, endDate } = req.query;

//         let dateFilter = {};
//         if (startDate && endDate) {
//             const start = new Date(`${startDate}T00:00:00.000Z`);
//             const end = new Date(`${endDate}T23:59:59.999Z`);
//             dateFilter = {
//                 createDate: {
//                     gte: start,
//                     lte: end,
//                 },
//             };
//         }

//         // ดึงข้อมูลทั้งหมด (แยกตาม companyId + buildingId)
//         const grouped = await prisma.repair.groupBy({
//             by: ['companyId', 'buildingId', 'status'],
//             where: {
//                 isDraft: false,
//                 ...dateFilter,
//             },
//             _count: {
//                 _all: true,
//             },
//         });

//         // หารายชื่อ company และ building ที่เกี่ยวข้อง
//         const companyIds = [...new Set(grouped.map(item => item.companyId))];
//         const buildingIds = [...new Set(grouped.map(item => item.buildingId))];

//         const companies = await prisma.company.findMany({
//             where: { id: { in: companyIds } },
//             select: { id: true, companyName: true, buildingId: true },
//         });

//         const buildings = await prisma.building.findMany({
//             where: { id: { in: buildingIds } },
//             select: { id: true, buildingName: true },
//         });

//         // รวมข้อมูลโดยนับจำนวนแต่ละสถานะ แล้วคิดเปอร์เซ็นต์
//         const resultMap = {};

//         grouped.forEach(item => {
//             const key = `${item.companyId}-${item.buildingId}`;
//             if (!resultMap[key]) {
//                 resultMap[key] = {
//                     companyId: item.companyId,
//                     buildingId: item.buildingId,
//                     pending: 0,
//                     in_progress: 0,
//                     completed: 0,
//                     total: 0,
//                 };
//             }

//             const count = item._count._all;
//             resultMap[key].total += count;

//             if (item.status === 'pending') resultMap[key].pending += count;
//             if (item.status === 'in_progress') resultMap[key].in_progress += count;
//             if (item.status === 'completed') resultMap[key].completed += count;
//         });

//         const result = Object.values(resultMap).map(item => {
//             const company = companies.find(c => c.id === item.companyId);
//             const building = buildings.find(b => b.id === item.buildingId);

//             const { pending, in_progress, completed, total } = item;

//             return {
//                 companyId: item.companyId,
//                 companyName: company?.companyName ?? null,
//                 buildingId: item.buildingId,
//                 buildingName: building?.buildingName ?? null,
//                 total,
//                 pending,
//                 in_progress,
//                 completed,
//                 pendingPercent: total ? (pending / total * 100).toFixed(2) : '0.00',
//                 inProgressPercent: total ? (in_progress / total * 100).toFixed(2) : '0.00',
//                 completedPercent: total ? (completed / total * 100).toFixed(2) : '0.00',
//             };
//         });

//         res.json({
//             message: "Get company repair count grouped by company and building with status percentage",
//             data: result,
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server Error" });
//     }
// };

exports.getCompanyRepairCount = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`);
            const end = new Date(`${endDate}T23:59:59.999Z`);
            dateFilter = {
                createDate: {
                    gte: start,
                    lte: end,
                },
            };
        }

        // GROUP BY status
        const grouped = await prisma.repair.groupBy({
            by: ['companyId', 'buildingId', 'status'],
            where: {
                isDraft: false,
                ...dateFilter,
            },
            _count: {
                _all: true,
            },
        });

        // Collect all unique companyId/buildingId
        const companyIds = [...new Set(grouped.map((item) => item.companyId))];
        const buildingIds = [...new Set(grouped.map((item) => item.buildingId))];

        const companies = await prisma.company.findMany({
            where: { id: { in: companyIds } },
            select: { id: true, companyName: true },
        });

        const buildings = await prisma.building.findMany({
            where: { id: { in: buildingIds } },
            select: { id: true, buildingName: true },
        });

        // ✅ รวมสถานะงาน
        const resultMap = {};
        grouped.forEach((item) => {
            const key = `${item.companyId}-${item.buildingId}`;
            if (!resultMap[key]) {
                resultMap[key] = {
                    companyId: item.companyId,
                    buildingId: item.buildingId,
                    pending: 0,
                    in_progress: 0,
                    completed: 0,
                    total: 0,
                };
            }

            const count = item._count._all;
            resultMap[key].total += count;

            if (item.status === 'pending') resultMap[key].pending += count;
            if (item.status === 'in_progress') resultMap[key].in_progress += count;
            if (item.status === 'completed') resultMap[key].completed += count;
        });

        // ✅ ดึงรายการทั้งหมดเพื่อนับตามวัน/เดือน
        const dailyRepairs = await prisma.repair.findMany({
            where: {
                isDraft: false,
                ...dateFilter,
            },
            select: {
                companyId: true,
                buildingId: true,
                createDate: true,
            },
        });

        // ✅ แยกตามวัน/เดือน
        const weeklyMap = {};
        const dayOfMonthMap = {};
        const monthMap = {};

        dailyRepairs.forEach((item) => {
            const key = `${item.companyId}-${item.buildingId}`;
            const date = new Date(item.createDate);
            const weekday = date.toLocaleString('en-US', {
                weekday: 'long',
                timeZone: 'Asia/Bangkok',
            }); // "Monday"
            const day = parseInt(
                date.toLocaleString('en-US', { day: '2-digit', timeZone: 'Asia/Bangkok' }),
                10
            ); // 1–31
            const month = date.toLocaleString('en-US', {
                month: 'short',
                timeZone: 'Asia/Bangkok',
            }); // "Jan"–"Dec"

            // 🟠 Weekly
            if (!weeklyMap[key]) {
                weeklyMap[key] = {
                    Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0,
                    Friday: 0, Saturday: 0, Sunday: 0,
                };
            }
            if (weeklyMap[key][weekday] !== undefined) {
                weeklyMap[key][weekday]++;
            }

            // 🟢 Day of Month
            //   if (!dayOfMonthMap[key]) dayOfMonthMap[key] = {};
            //   const dayKey = `day${day}`;
            //   dayOfMonthMap[key][dayKey] = (dayOfMonthMap[key][dayKey] || 0) + 1;
            // สร้างค่า default 0 สำหรับ day1 - day31
            if (!dayOfMonthMap[key]) {
                dayOfMonthMap[key] = {};
                for (let i = 1; i <= 31; i++) {
                    dayOfMonthMap[key][`day${i}`] = 0;
                }
            }

            // นับงานในแต่ละวัน
            const dayKey = `day${day}`;
            dayOfMonthMap[key][dayKey]++;


            // 🔵 Month
            if (!monthMap[key]) {
                monthMap[key] = {
                    Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
                    Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
                };
            }
            if (monthMap[key][month] !== undefined) {
                monthMap[key][month]++;
            }
        });

        // ✅ รวมผลลัพธ์ทั้งหมด
        const result = Object.values(resultMap).map((item) => {
            const key = `${item.companyId}-${item.buildingId}`;
            const company = companies.find((c) => c.id === item.companyId);
            const building = buildings.find((b) => b.id === item.buildingId);

            const { pending, in_progress, completed, total } = item;

            return {
                companyId: item.companyId,
                companyName: company?.companyName ?? null,
                buildingId: item.buildingId,
                buildingName: building?.buildingName ?? null,
                total,
                pending,
                in_progress,
                completed,
                pendingPercent: total ? (pending / total * 100).toFixed(2) : '0.00',
                inProgressPercent: total ? (in_progress / total * 100).toFixed(2) : '0.00',
                completedPercent: total ? (completed / total * 100).toFixed(2) : '0.00',
                ...(weeklyMap[key] || {}),
                ...(dayOfMonthMap[key] || {}),
                ...(monthMap[key] || {}),
            };
        });

        res.json({
            message: 'Get company repair count grouped by company/building with breakdowns',
            data: result,
        });
    } catch (error) {
        console.error('❌ getCompanyRepairCount error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// exports.getCompanyAllRepair = async (req, res) => {
//     try {
//         const { companyId } = req.params
//         const repair = await prisma.repair.findMany({
//             where: {
//                 companyId: Number(companyId),
//                 isDraft: false
//             },
//             include: {
//                 customer: true,
//                 acceptedBy: true,
//                 completedBy: true,
//                 company: true,
//                 building: true,
//                 unit: true,
//                 images: true,
//                 choices: {
//                     include: {
//                         repairChoice: true
//                     }
//                 }
//             }
//         })

//         const companyData = {
//             companyName: repair[0]?.company?.companyName || null,
//             buildingName: repair[0]?.building?.buildingName || null,
//             unitName: repair[0]?.unit?.unitName || null,
//             totalRepairs: repair.length
//         };

//         res.json({ message: "Get repair by worker company sucess", companyData: companyData, data: repair })
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Server Error" })
//     }
// }



//exports.getCompanyAllRepair = async (req, res) => {
  //  try {
    //    const { companyId } = req.params;

      //  const repairs = await prisma.repair.findMany({
         //   where: {
           //     companyId: Number(companyId),
            //    isDraft: false,
           // },
           // include: {
             //   customer: true,
             //   acceptedBy: true,
             //   completedBy: true,
             //   company: true,
             //   building: true,
             //   unit: true,
             //   images: true,
             //   choices: {
             //       include: {
             //           repairChoice: true,
             //       },
             //   },
          //  },
      //  });

       //  const totalRepairs = repairs.length;

        // นับงานตามสถานะ
       // let pending = 0;
      //  let inProgress = 0;
     //   let completed = 0;

      //  repairs.forEach((job) => {
        //    if (job.completedBy) {
          //      completed++;
          //  } else if (job.acceptedBy) {
          //      inProgress++;
          //  } else {
            //    pending++;
          //  }
       // });

      //  const companyData = {
        //    companyName: repairs[0]?.company?.companyName || null,
         //   buildingName: repairs[0]?.building?.buildingName || null,
         //   unitName: repairs[0]?.unit?.unitName || null,
         //   totalRepairs,
         //   statusCount: {
          //      pending,
          //      inProgress,
          //      completed,
          //  },
          //  statusPercentage: {
          //      pending: totalRepairs ? ((pending / totalRepairs) * 100).toFixed(2) : 0,
            //    inProgress: totalRepairs ? ((inProgress / totalRepairs) * 100).toFixed(2) : 0,
            //    completed: totalRepairs ? ((completed / totalRepairs) * 100).toFixed(2) : 0,
          //  },
      //  };

      //  res.json({
       //     message: "Get repair by worker company success",
         //   companyData: companyData,
        //    data: repairs,
      //  });
  //  } catch (error) {
    //    console.log(error);
      //  res.status(500).json({ message: "Server Error" });
  //  }
// };


exports.getCompanyAllRepair = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { startDate, endDate } = req.query; // รับช่วงวันที่จาก query string

        // สร้างเงื่อนไขเวลาถ้าได้รับค่า startDate, endDate
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else if (startDate) {
            dateFilter = {
                gte: new Date(startDate),
            };
        } else if (endDate) {
            dateFilter = {
                lte: new Date(endDate),
            };
        }

        const repairs = await prisma.repair.findMany({
            where: {
                companyId: Number(companyId),
                isDraft: false,
                // ถ้ามี dateFilter ให้ใส่ลงในฟิลด์เวลาของ repair เช่น createdAt หรือ reportDate
                ...(Object.keys(dateFilter).length > 0 && {
                    createDate: dateFilter,  // เปลี่ยนเป็นฟิลด์วันที่ของคุณ
                }),
            },
            include: {
                customer: true,
                acceptedBy: true,
                completedBy: true,
                company: true,
                building: true,
                unit: true,
                images: true,
                choices: {
                    include: {
                        repairChoice: true,
                    },
                },
            },
        });

        const totalRepairs = repairs.length;

        // นับงานตามสถานะ
        let pending = 0;
        let inProgress = 0;
        let completed = 0;

        repairs.forEach((job) => {
            if (job.completedBy) {
                completed++;
            } else if (job.acceptedBy) {
                inProgress++;
            } else {
                pending++;
            }
        });

        const companyData = {
            companyName: repairs[0]?.company?.companyName || null,
            buildingName: repairs[0]?.building?.buildingName || null,
            unitName: repairs[0]?.unit?.unitName || null,
            totalRepairs,
            statusCount: {
                pending,
                inProgress,
                completed,
            },
            statusPercentage: {
                pending: totalRepairs ? ((pending / totalRepairs) * 100).toFixed(2) : 0,
                inProgress: totalRepairs ? ((inProgress / totalRepairs) * 100).toFixed(2) : 0,
                completed: totalRepairs ? ((completed / totalRepairs) * 100).toFixed(2) : 0,
            },
        };

        res.json({
            message: "Get repair by worker company success",
            companyData: companyData,
            data: repairs,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteChoiceFake = async (req, res) => {
    try {
        const { id } = req.params
        const choice = await prisma.repairChoice.update({
            where: {
                id: Number(id)
            },
            data: {
                isDelete: true,
                fakeDelete: true
            }
        })
        res.json({ message: "Delete Choice success", data: choice })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}
