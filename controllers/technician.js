const prisma = require('../config/prisma')
const moment = require('moment-timezone')
moment.tz.setDefault("Asia/Bangkok")
moment.locale('th')
const { sendLineNotify } = require('../utils/line')
const upload = require('../middlewares/upload')
const { wrap } = require('module')
require('dotenv')

// const generateJobNo = async () => {
//     const now = new Date()
//     const year = now.getFullYear()
//     const month = String(now.getMonth() + 1).padStart(2, '0')

//     const prefix = `${year}${month}`

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

//     // 🏢 ตัด prefix จากชื่ออาคาร
//     let buildingPrefix = '';
//     if (buildingName.includes(' ')) {
//         const parts = buildingName.trim().split(/\s+/);
//         buildingPrefix = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//     } else {
//         buildingPrefix = buildingName.trim()[0].toUpperCase();
//     }

//     const ymPrefix = `${year}${month}`;

//     // ✅ ดูเฉพาะ YYMM เพื่อหาลำดับล่าสุด (ไม่สน prefix ตัวอักษร)
//     const lastJob = await prisma.repair.findFirst({
//         where: {
//             jobNo: {
//                 contains: ymPrefix
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

// exports.createRepairTech = async (req, res) => {
//     try {
//         const {
//             customerUserId,
//             ownerId,
//             detail,
//             choiceDesc,
//             // buildingId,
//             companyName,
//         } = req.body

//         const rawChoices = req.body.choices
//         const choices = Array.isArray(rawChoices)
//             ? rawChoices
//             : rawChoices
//                 ? [rawChoices]
//                 : []

//         const protocol = req.headers['x-forwarded-proto'] || req.protocol
//         const images = (req.files || []).map(file => {
//             return `${protocol}://${req.get('host')}/uploads/${file.filename}`
//         })

//         let customer = null
//         let unit = null
//         let company = null
//         let building = null

//         if (customerUserId && customerUserId.trim() !== "") {
//             // 👉 กรณีมี customerUserId
//             customer = await prisma.customer.findUnique({
//                 where: { userId: customerUserId },
//                 include: {
//                     unit: {
//                         include: {
//                             company: {
//                                 include: {
//                                     building: true
//                                 }
//                             }
//                         }
//                     }
//                 }
//             })

//             if (!customer || !customer.unit || !customer.unit.company || !customer.unit.company.building) {
//                 return res.status(400).json({ message: "ไม่พบข้อมูลลูกค้า หน่วย บริษัท หรืออาคาร" })
//             }

//             unit = customer.unit
//             company = unit.company
//             building = company.building

//         } else if (companyName && companyName.trim() !== "") {
//             // 👉 กรณีใช้ companyName
//             const firstCustomer = await prisma.customer.findFirst({
//                 where: {
//                     unit: {
//                         company: {
//                             companyName: {
//                                 equals: companyName.trim(),
//                                 mode: 'insensitive'
//                             }
//                         }
//                     }
//                 },
//                 include: {
//                     unit: {
//                         include: {
//                             company: {
//                                 include: {
//                                     building: true
//                                 }
//                             }
//                         }
//                     }
//                 }
//             })

//             if (!firstCustomer || !firstCustomer.unit?.company?.building) {
//                 return res.status(400).json({ message: "ไม่พบข้อมูลลูกค้าในบริษัทนี้" })
//             }

//             customer = firstCustomer
//             unit = customer.unit
//             company = unit.company
//             building = company.building
//         } else {
//             return res.status(400).json({ message: "กรุณาระบุ customerUserId หรือ companyName อย่างใดอย่างหนึ่ง" })
//         }

//         const newJobNo = await generateJobNo()

//         let choiceDescription = ""
//         const choiceConnects = []

//         if (choices.length > 0) {
//             for (const choiceName of choices) {
//                 let existing = await prisma.repairChoice.findFirst({
//                     where: { choiceName: choiceName.trim() }
//                 })

//                 if (!existing) {
//                     existing = await prisma.repairChoice.create({
//                         data: { choiceName: choiceName.trim() }
//                     })
//                 }

//                 choiceDescription += (choiceDescription ? ", " : "") + existing.choiceName
//                 choiceConnects.push({
//                     repairChoice: { connect: { id: existing.id } }
//                 })
//             }
//         }

//         if (choiceDesc && choiceDesc.trim() !== "") {
//             choiceDescription += (choiceDescription ? ", " : "") + choiceDesc.trim()
//         }

//         // const newRepair = await prisma.repair.create({
//         //     data: {
//         //         jobNo: newJobNo,
//         //         customerUserId,
//         //         ownerId,
//         //         unitId: unit.id,
//         //         companyId: company.id,
//         //         buildingId: building.id,
//         //         detail,
//         //         choiceDesc: choiceDescription,
//         //         status: "pending",
//         //         companyName: company.companyName,
//         //         choices: {
//         //             create: choiceConnects
//         //         },
//         //         images: {
//         //             create: images.map(url => ({
//         //                 url,
//         //                 uploadBy: "tech"
//         //             }))
//         //         }
//         //     },
//         //     include: {
//         //         building: true,
//         //         customer: true,
//         //         images: true
//         //     }
//         // })
//         const repairData = {
//             jobNo: newJobNo,
//             ownerId,
//             unitId: unit.id,
//             companyId: company.id,
//             buildingId: building.id,
//             detail,
//             choiceDesc: choiceDescription,
//             status: "pending",
//             companyName: company.companyName,
//             choices: {
//                 create: choiceConnects
//             },
//             images: {
//                 create: images.map(url => ({
//                     url,
//                     uploadBy: "tech"
//                 }))
//             }
//         }

//         // ✅ เพิ่ม customerUserId เฉพาะเมื่อไม่ใช่ "" หรือ undefined
//         if (customerUserId && customerUserId.trim() !== "") {
//             repairData.customerUserId = customerUserId.trim()
//         }

//         const newRepair = await prisma.repair.create({
//             data: repairData,
//             include: {
//                 building: true,
//                 customer: true,
//                 images: true
//             }
//         })



//         const m = moment();
//         const day = m.format("D");
//         const month = m.format("MMM");
//         const year = (m.year() + 543).toString().slice(-2);
//         const time = m.format("HH:mm");

//         const jobTime = `${day} ${month} ${year} เวลา ${time} น.`;

//         const repairWebUrl = `${process.env.WEB_BASE_URL}/repair/${newRepair.id}`

//         const messageToGroup = {
//             type: "flex",
//             altText: "📋 แจ้งงานซ่อมใหม่",
//             contents: {
//                 type: "bubble",
//                 body: {
//                     type: "box",
//                     layout: "vertical",
//                     contents: [
//                         { type: "text", text: "งานใหม่", weight: "bold", size: "lg", color: "#837958" },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `หมายเลขงาน :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${newJobNo}`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `วันที่แจ้ง :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${jobTime}`, size: "sm", flex: 4 },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `บริษัท :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${company.companyName}`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `สถานที่ :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${building.buildingName}, ${unit.unitName}`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         // {
//                         //     type: "box",
//                         //     layout: "baseline",
//                         //     contents: [
//                         //         { type: "text", text: `สถานที่ :`, size: "sm", flex: 2 },
//                         //         { type: "text", text: `${unit.unitName}`, size: "sm", wrap: true, flex: 4 },
//                         //     ]
//                         // },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `ผู้แจ้ง :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${customer.name ?? "-"} (${customer.phone})`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `กลุ่มงาน :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${choiceDescription}`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `รายละเอียด :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${detail}`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `สถานะ :`, size: "sm", color: "#FF0000", weight: "bold", flex: 2 },
//                                 { type: "text", text: `รอดำเนินการ`, size: "sm", wrap: true, color: "#FF0000", weight: "bold", flex: 4 },
//                             ]
//                         },
//                         ...(images.length > 0
//                             ? images.map(url => ({
//                                 type: "image",
//                                 url: url,
//                                 size: "full",
//                                 aspectRatio: "16:9",
//                                 aspectMode: "cover",
//                                 margin: "md"
//                             }))
//                             : [])
//                     ]
//                 },
//                 // footer: {
//                 //     type: "box",
//                 //     layout: "vertical",
//                 //     spacing: "sm",
//                 //     contents: [
//                 //         {
//                 //             type: "button",
//                 //             style: "primary",
//                 //             action: {
//                 //                 type: "uri",
//                 //                 label: "เปิดดูและรับงาน",
//                 //                 uri: repairWebUrl
//                 //             }
//                 //         }
//                 //     ]
//                 // }
//                 footer: {
//                     type: "box",
//                     layout: "vertical",
//                     spacing: "sm",
//                     contents: [
//                         {
//                             type: "button",
//                             style: "secondary",
//                             height: "sm",
//                             color: "#F4F2ED",
//                             action: {
//                                 type: "uri",
//                                 label: "รายละเอียด",
//                                 uri: repairWebUrl
//                             },
//                             // "color": "#FFFFFF",          // พื้นหลังโปร่งใส
//                             // "margin": "md"
//                             // "borderWidth": "1px",
//                             // "borderColor": "837958"
//                         }
//                     ],
//                     flex: 0
//                 }
//             }
//         }

//         const messageToCustomer = {
//             type: "flex",
//             altText: "📋 แจ้งซ่อม",
//             contents: {
//                 type: "bubble",
//                 body: {
//                     type: "box",
//                     layout: "vertical",
//                     contents: [
//                         { type: "text", text: "การแจ้งซ่อมสำเร็จ", weight: "bold", size: "lg", color: "#837958" },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `หมายเลขงาน :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${newJobNo}`, size: "sm", wrap: true },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `วันที่แจ้ง :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${jobTime}`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         // { type: "text", text: `บริษัท : ${company.companyName}`, size: "sm", wrap: true },
//                         // { type: "text", text: `อาคาร: ${building.buildingName}`, size: "sm", wrap: true },
//                         // { type: "text", text: `สถานที่: ${unit.unitName}`, size: "sm", wrap: true },
//                         // { type: "text", text: `ผู้แจ้ง: ${customer.name ?? "-"}`, size: "sm", wrap: true },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `กลุ่มงาน :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${choiceDescription}`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `รายละเอียด :`, size: "sm", flex: 2 },
//                                 { type: "text", text: `${detail}`, size: "sm", wrap: true, flex: 4 },
//                             ]
//                         },
//                         {
//                             type: "box",
//                             layout: "baseline",
//                             contents: [
//                                 { type: "text", text: `สถานะ :`, size: "sm", color: "#FF0000", weight: "bold", flex: 2 },
//                                 { type: "text", text: `รอดำเนินการ`, size: "sm", wrap: true, color: "#FF0000", weight: "bold", flex: 4 },
//                             ]
//                         },
//                         ...(images.length > 0
//                             ? images.map(url => ({
//                                 type: "image",
//                                 url: url,
//                                 size: "full",
//                                 aspectRatio: "16:9",
//                                 aspectMode: "cover",
//                                 margin: "md"
//                             }))
//                             : [])
//                     ]
//                 }
//             }
//         }

//         // ✅ แจ้งเตือนช่าง
//         if (building.groupId) {
//             await sendLineNotify(building.groupId, messageToGroup)
//         }

//         // ✅ แจ้งเตือนลูกค้า
//         if (customerUserId && customerUserId.trim() !== "") {
//             await sendLineNotify(customerUserId, messageToCustomer)
//         } else if (companyName && companyName.trim() !== "") {
//             const customersInCompany = await prisma.customer.findMany({
//                 where: {
//                     unit: {
//                         company: {
//                             companyName: companyName.trim()
//                         }
//                     }
//                 },
//                 select: {
//                     userId: true
//                 }
//             })

//             const userIds = customersInCompany.map(c => c.userId).filter(uid => !!uid)

//             for (const userId of userIds) {
//                 await sendLineNotify(userId, messageToCustomer)
//             }
//         }

//         return res.json({ message: "แจ้งซ่อมสำเร็จ", data: newRepair })

//     } catch (error) {
//         console.error(error)
//         return res.status(500).json({ message: "Server Error" })
//     }
// }

exports.createRepairTech = async (req, res) => {
    try {
        const {
            customerUserId,
            ownerId,
            detail,
            choiceDesc,
            companyName,
            preworkDate,
        } = req.body;

        const rawChoices = req.body.choices;
        const choices = Array.isArray(rawChoices)
            ? rawChoices
            : rawChoices
                ? [rawChoices]
                : [];

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const images = (req.files || []).map(file => {
            return `${protocol}://${req.get('host')}/uploads/${file.filename}`;
        });

        let parsedPreworkDate = null;
        if (preworkDate) {
            parsedPreworkDate = new Date(preworkDate)
            if (isNaN(parsedPreworkDate.getDate())) {
                return res.status(400).json({ message: "รูปแบบวันที่นัดหมายไม่ถูกต้อง" })
            }
        }

        let customer = null;
        let unit = null;
        let company = null;
        let building = null;

        // ✅ เงื่อนไขหลัก: ถ้ามี customerUserId จะไม่สน companyName
        if (customerUserId && customerUserId.trim() !== "") {
            customer = await prisma.customer.findUnique({
                where: { userId: customerUserId.trim() },
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
            });

            if (!customer || !customer.unit || !customer.unit.company || !customer.unit.company.building) {
                return res.status(400).json({ message: "ไม่พบข้อมูลลูกค้า หน่วย บริษัท หรืออาคาร" });
            }

            unit = customer.unit;
            company = unit.company;
            building = company.building;

        } else if (companyName && companyName.trim() !== "") {
            // ✅ ถ้าไม่มี customerUserId ให้ใช้ companyName แทน
            const firstCustomer = await prisma.customer.findFirst({
                where: {
                    unit: {
                        company: {
                            companyName: {
                                equals: companyName.trim(),
                                mode: 'insensitive'
                            }
                        }
                    }
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
            });

            if (!firstCustomer || !firstCustomer.unit?.company?.building) {
                return res.status(400).json({ message: "ไม่พบข้อมูลลูกค้าในบริษัทนี้" });
            }

            customer = firstCustomer;
            unit = customer.unit;
            company = unit.company;
            building = company.building;

        } else {
            return res.status(400).json({ message: "กรุณาระบุ customerUserId หรือ companyName อย่างใดอย่างหนึ่ง" });
        }

        let displayCustomerName = "-"
        let displayCustomerPhone = "-"

        if (customerUserId && customerUserId.trim() !== "") {
            displayCustomerName = customer.name ?? "-"
            displayCustomerPhone = customer.phone ?? "-"
        }

        // ✅ Generate Job Number
        // const newJobNo = await generateJobNo();
        const newJobNo = await generateJobNo(building.buildingName);

        // ✅ เตรียมข้อมูล choices
        let choiceDescription = "";
        const choiceConnects = [];

        if (choices.length > 0) {
            for (const choiceName of choices) {
                let existing = await prisma.repairChoice.findFirst({
                    where: { choiceName: choiceName.trim() }
                });

                if (!existing) {
                    existing = await prisma.repairChoice.create({
                        data: { choiceName: choiceName.trim() }
                    });
                }

                choiceDescription += (choiceDescription ? ", " : "") + existing.choiceName;
                choiceConnects.push({
                    repairChoice: { connect: { id: existing.id } }
                });
            }
        }

        if (choiceDesc && choiceDesc.trim() !== "") {
            choiceDescription += (choiceDescription ? ", " : "") + choiceDesc.trim();
        }

        // ✅ Prepare data for repair creation
        const repairData = {
            jobNo: newJobNo,
            ownerId,
            unitId: unit.id,
            companyId: company.id,
            buildingId: building.id,
            detail,
            choiceDesc: choiceDescription,
            status: "pending",
            companyName: company.companyName,
            preworkDate: parsedPreworkDate,
            choices: {
                create: choiceConnects
            },
            images: {
                create: images.map(url => ({
                    url,
                    uploadBy: "tech",
                    mark: "techRepair"
                }))
            }
        };


        // 👉 เพิ่ม customerUserId เฉพาะเมื่อมีจริง
        if (customerUserId && customerUserId.trim() !== "") {
            repairData.customerUserId = customerUserId.trim();
        }

        const newRepair = await prisma.repair.create({
            data: repairData,
            include: {
                building: true,
                customer: true,
                images: true
            }
        });

        // ✅ เตรียมข้อความ Line Notify
        const m = moment();
        const day = m.format("D");
        const month = m.format("MMM");
        const year = (m.year() + 543).toString().slice(-2);
        const time = m.format("HH:mm");
        const jobTime = `${day} ${month} ${year} เวลา ${time} น.`;
        const repairWebUrl = `${process.env.WEB_BASE_URL}/accept-repair/${newRepair.id}`;

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
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `ผู้แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${displayCustomerName} (${displayCustomerPhone})`, size: "sm", wrap: true, flex: 4 },
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
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            height: "sm",
                            //   color: "#F4F2ED",
                            action: {
                                type: "uri",
                                label: "รายละเอียด",
                                uri: repairWebUrl
                            },
                        }
                    ],
                    flex: 0
                }
            }
        };

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
                                { type: "text", text: `${detail || "-"}`, size: "sm", wrap: true, flex: 4 },
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
        };

        // ✅ แจ้งกลุ่มช่าง
        if (building.groupId) {
            await sendLineNotify(building.groupId, messageToGroup);
        }

        // ✅ แจ้งลูกค้า
        if (customerUserId && customerUserId.trim() !== "") {
            await sendLineNotify(customerUserId, messageToCustomer);
        } else if (companyName && companyName.trim() !== "") {
            const customersInCompany = await prisma.customer.findMany({
                where: {
                    unit: {
                        company: {
                            companyName: companyName.trim()
                        }
                    }
                },
                select: {
                    userId: true
                }
            });

            const userIds = customersInCompany.map(c => c.userId).filter(uid => !!uid);

            for (const userId of userIds) {
                await sendLineNotify(userId, messageToCustomer);
            }
        }

        return res.json({ message: "แจ้งซ่อมสำเร็จ", data: newRepair });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
};


exports.getTechnicianById = async (req, res) => {
    try {
        const { userId } = req.params

        const technician = await prisma.technician.findUnique({
            where: {
                userId
            },
            include: {
                techBuilds: {
                    include: {
                        building: true
                    }
                }
            }
        })

        const seenBuildingIds = new Set()
        const uniqueTechBuilds = []

        for (const tb of technician.techBuilds) {
            if (!seenBuildingIds.has(tb.buildingId)) {
                seenBuildingIds.add(tb.buildingId)
                uniqueTechBuilds.push(tb)
            }
        }

        // ✅ เขียนทับ techBuilds เดิม ไม่สร้างชื่อใหม่
        res.json({
            message: "Get technician user success",
            data: {
                ...technician,
                techBuilds: uniqueTechBuilds
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

// exports.completeRepair = async (req, res) => {
//     try {
//         const { id, actionDetail, workStar, techCompleteUserId } = req.body
//         console.log("actionDetail", actionDetail)

//         // สร้าง URL สำหรับรูปภาพ
//         const protocol = req.headers['x-forwarded-proto'] || req.protocol
//         const imageUrls = (req.files || []).map(file => {
//             return `${protocol}://${req.get('host')}/uploads/${file.filename}`
//         })

//         // ดึง createDate จากงานซ่อม
//         const repair = await prisma.repair.findFirst({
//             where: { id: Number(id) },
//             select: { createDate: true }
//         })

//         if (!repair?.createDate) {
//             return res.status(400).json({ error: "ไม่พบเวลาแจ้งงาน" })
//         }

//         if (repair.status === 'completed' && repair.isDraft === false) {
//             return res.status(400).json({ message: 'งานนี้ถูกจบแล้ว ไม่สามารถจบซ้ำได้' })
//         }

//         // เวลาเสร็จงาน
//         const completeDate = moment().tz("Asia/Bangkok").toDate()

//         // คำนวณเวลาทั้งหมดที่ใช้เป็นนาที
//         const totalMinutes = Math.floor(
//             (completeDate.getTime() - new Date(repair.createDate).getTime()) / (1000 * 60)
//         )

//         // อัปเดตข้อมูลงานซ่อม
//         const updateRepair = await prisma.repair.update({
//             where: { id: Number(id) },
//             data: {
//                 status: 'completed',
//                 isDraft: false,
//                 completeDate,
//                 totalTime: totalMinutes,
//                 actionDetail,
//                 workStar: Number(workStar),
//                 techCompleteUserId,
//                 images: {
//                     create: imageUrls.map(url => ({
//                         url,
//                         uploadBy: 'tech'
//                     }))
//                 }
//             }
//         })

//         // ดึงข้อมูลเต็มสำหรับการส่ง Flex
//         const fullRepair = await prisma.repair.findFirst({
//             where: { id: Number(id) },
//             include: {
//                 company: true,
//                 building: true,
//                 unit: true,
//                 customer: true
//             }
//         })

//         const jobNo = fullRepair.jobNo || `#${fullRepair.id}`
//         const completeTime = moment(completeDate).locale("th").format("D MMM YY HH:mm") + " น."

//         // ดึงข้อมูลช่าง
//         const [acceptTech, completeTech] = await Promise.all([
//             fullRepair.technicianUserId
//                 ? prisma.technician.findUnique({
//                       where: { userId: fullRepair.technicianUserId }
//                   })
//                 : null,
//             fullRepair.techCompleteUserId
//                 ? prisma.technician.findUnique({
//                       where: { userId: fullRepair.techCompleteUserId }
//                   })
//                 : null
//         ])

//         // สร้างข้อความชื่อช่าง
//         let technicianText = ""
//         if (
//             fullRepair.technicianUserId &&
//             fullRepair.techCompleteUserId &&
//             fullRepair.technicianUserId === fullRepair.techCompleteUserId
//         ) {
//             technicianText = `ผู้จบงาน: ${completeTech?.name || "-"}`
//         } else {
//             technicianText = [
//                 `ผู้รับงาน: ${acceptTech?.name || "-"}`,
//                 `ผู้จบงาน: ${completeTech?.name || "-"}`
//             ].join("\n")
//         }

//         // Flex Message: ลูกค้า
//         const messageToCustomer = {
//             type: "flex",
//             altText: "📌 งานซ่อมของคุณเสร็จเรียบร้อยแล้ว",
//             contents: {
//                 type: "bubble",
//                 body: {
//                     type: "box",
//                     layout: "vertical",
//                     contents: [
//                         { type: "text", text: "✅ งานซ่อมเสร็จเรียบร้อยแล้ว", weight: "bold", size: "lg" },
//                         { type: "text", text: `หมายเลขงาน: ${jobNo}`, size: "md", wrap: true },
//                         { type: "text", text: `เวลาที่เสร็จ: ${completeTime}`, size: "sm" },
//                         // { type: "text", text: `เวลาที่เสร็จ: ${completeTime}`, size: "sm" },
//                         { type: "text", text: `บริษัท: ${fullRepair.company.companyName}`, size: "sm", wrap: true },
//                         { type: "text", text: `อาคาร: ${fullRepair.building.buildingName}`, size: "sm", wrap: true },
//                         { type: "text", text: `สถานที่: ${fullRepair.unit.unitName}`, size: "sm", wrap: true },
//                         { type: "text", text: `ผู้แจ้ง: ${fullRepair.customer.name}`, size: "sm", wrap: true },
//                         { type: "text", text: technicianText, size: "sm", wrap: true },
//                         { type: "text", text: `รายละเอียด: ${actionDetail}`, size: "sm", wrap: true },
//                         { type: "text", text: `สถานะ: เสร็จสิ้น`, size: "sm", wrap: true, color: "#00B900" },
//                         ...(imageUrls.length > 0
//                             ? imageUrls.map(url => ({
//                                 type: "image",
//                                 url,
//                                 size: "full",
//                                 aspectRatio: "16:9",
//                                 aspectMode: "cover",
//                                 margin: "md"
//                             }))
//                             : [])
//                     ]
//                 }
//             }
//         }

//         // Flex Message: กลุ่มช่าง
//         const messageToGroup = {
//             type: "flex",
//             altText: "✅ งานซ่อมเสร็จแล้ว",
//             contents: {
//                 type: "bubble",
//                 body: {
//                     type: "box",
//                     layout: "vertical",
//                     contents: [
//                         { type: "text", text: "✅ งานเสร็จสิ้น", weight: "bold", size: "lg" },
//                         { type: "text", text: `หมายเลขงาน: ${jobNo}`, size: "md", wrap: true },
//                         { type: "text", text: `เวลาที่เสร็จ: ${completeTime}`, size: "sm" },
//                         { type: "text", text: `บริษัท: ${fullRepair.company.companyName}`, size: "sm", wrap: true },
//                         { type: "text", text: `อาคาร: ${fullRepair.building.buildingName}`, size: "sm", wrap: true },
//                         { type: "text", text: `สถานที่: ${fullRepair.unit.unitName}`, size: "sm", wrap: true },
//                         { type: "text", text: `ผู้แจ้ง: ${fullRepair.customer.name}`, size: "sm", wrap: true },
//                         { type: "text", text: technicianText, size: "sm", wrap: true, color: "#666666" },
//                         { type: "text", text: `รายละเอียด: ${actionDetail}`, size: "sm", wrap: true },
//                         ...(imageUrls.length > 0
//                             ? imageUrls.map(url => ({
//                                 type: "image",
//                                 url,
//                                 size: "full",
//                                 aspectRatio: "16:9",
//                                 aspectMode: "cover",
//                                 margin: "md"
//                             }))
//                             : [])
//                     ]
//                 }
//             }
//         }

//         // ส่ง LINE ไปยังลูกค้าและกลุ่มช่าง
//         await sendLineNotify(fullRepair.customerUserId, messageToCustomer)
//         await sendLineNotify(fullRepair.building.groupId, messageToGroup)

//         return res.json({
//             message: 'บันทึกงานเสร็จสมบูรณ์และส่งแจ้งเตือนแล้ว',
//             data: updateRepair
//         })

//     } catch (error) {
//         console.error(error)
//         res.status(500).json({ message: "Server Error" })
//     }
// }

exports.createContractorNote = async (req, res) => {
    try {
        const { message } = req.body
        const contractor = await prisma.contractorNote.create({
            data: {
                message
            }
        })
        res.json({ message: "Create contractor success", data: contractor })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getContractor = async (req, res) => {
    try {
        const contractor = await prisma.contractorNote.findMany()
        res.json({ message: "Get contractor success", data: contractor })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.updateContractor = async (req, res) => {
    try {
        const { id, message } = req.body
        const contractor = await prisma.contractorNote.update({
            where: {
                id: Number(id)
            },
            data: {
                message
            }
        })
        res.json({ message: "Update message success", data: contractor })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.approveContractor = async (req, res) => {
    try {
        const { id, isDelete } = req.body
        const contractor = await prisma.contractorNote.update({
            where: {
                id: Number(id)
            },
            data: {
                isDelete
            }
        })
        res.json({ message: "Approve contractor success", data: contractor })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.saveDraftRepair = async (req, res) => {
    try {
        const { id, actionDetail, workStar, contractorNote } = req.body
        const protocol = req.headers['x-forwarded-proto'] || req.protocol
        const imageUrls = (req.files || []).map(file => {
            return `${protocol}://${req.get('host')}/uploads/${file.filename}`
        })

        const draftRepair = await prisma.repair.update({
            where: { id: Number(id) },
            data: {
                isDraft: true,
                actionDetail,
                workStar: Number(workStar),
                contractorNote: contractorNote || null,
                images: {
                    create: imageUrls.map(url => ({
                        url,
                        uploadBy: 'tech',
                        isDraft: true,
                    }))
                }
            }
        })
        res.json({ message: "Draft success", data: draftRepair })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

// exports.getDraftById = async (req, res) => {
//     try {
//         const { id } = req.params
//         const draft = await prisma.repair.findFirst({
//             where: {
//                 id: Number(id),
//                 isDraft: true
//             },
//             include: {
//                 images: true,
//                 unit: true,
//                 company: true,
//                 building: true,
//                 building: true,
//                 customer: true,
//                 technician: true
//             }
//         })
//         draft.images = draft.images.filter(img => !img.url.includes('signature'))
//         res.json({ message: "Get draft by id success", data: draft })
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Server Error" })
//     }
// }

exports.getDraftById = async (req, res) => {
    try {
        const { id } = req.params;

        const draft = await prisma.repair.findFirst({
            where: {
                id: Number(id),
                isDraft: true
            },
            include: {
                images: {
                    where: {
                        isDraft: true // ✅ ดึงเฉพาะ draft
                    }
                },
                unit: true,
                company: true,
                building: true,
                customer: true,
                technician: true
            }
        });

        // ✅ กรองเฉพาะที่ไม่ใช่ลายเซ็น
        draft.images = draft.images.filter(img => !img.url.includes('signature'));

        res.json({ message: "Get draft by id success", data: draft });
    } catch (error) {
        console.log(error);
       res.status(500).json({ message: "Server Error" });
    }

//  if (!draft || !Array.isArray(draft.images)) {  // ต้องมี {} ครอบ if
//    draft.images = [];
//  } else {
//    draft.images = draft.images.filter(img => !img.url.includes('signature'));
//  }

//  res.json({ message: "Get draft by id success", data: draft });
//} catch (error) {
//  console.log(error);
//  res.status(500).json({ message: "Server Error" });


};


exports.getMyRepairAccept = async (req, res) => {
    try {
        const { userId } = req.params;

        const repair = await prisma.repair.findMany({
            where: {
                status: {
                    in: ["in_progress", "completed"],
                },
                OR: [
                    { techAcceptUserId: userId },
                    { techCompleteUserId: userId },
                ],
            },
            include: {
                company: true,
                building: true,
                unit: true,
                customer: true,
                images: true,
                acceptedBy: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        userId: true,
                    }
                },
                completedBy: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        userId: true,
                    }
                },
            },
        });

        res.json({ message: "Get my repair success", data: repair });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};


exports.acceptRepairTech = async (req, res) => {
    try {
        const { id, technicianUserId, techAcceptUserId } = req.body

        const existingRepair = await prisma.repair.findFirst({
            where: { id: Number(id) }
        })

        if (!existingRepair) {
            return res.status(404).json({ message: "ไม่พบงานที่ระบุ" })
        }

        if (existingRepair.status === "in_progress") {
            return res.status(400).json({ message: "งานนี้อยู่ระหว่างดำเนินการ ไม่สามารถรับซ้ำได้" })
        }

        const technician = await prisma.technician.findFirst({
            where: {
                userId: technicianUserId
            }
        })

        const m = moment();
        const day = m.format("D");
        const month = m.format("MMM");
        const year = (m.year() + 543).toString().slice(-2);
        const time = m.format("HH:mm");

        const acceptDateTH = `${day} ${month} ${year} เวลา ${time} น.`;
        const acceptDate = new Date().toISOString()

        const updateRepair = await prisma.repair.update({
            where: { id: Number(id) },
            data: {
                status: "in_progress",
                technicianUserId,
                techAcceptUserId,
                acceptDate: acceptDate
            },
            include: {
                customer: true,
                technician: true,
                acceptedBy: true,
                completedBy: true,
                company: {
                    include: {
                        building: true
                    }
                }
            }
        })

        const companyName = updateRepair.company?.companyName || "ไม่ทราบชื่อบริษัท"
        const groupId = updateRepair.company?.building?.groupId

        const webDetail = `${process.env.WEB_BASE_URL}/complete/${updateRepair.id}`
        const createMoment = moment(updateRepair.createDate).tz("Asia/Bangkok").locale("th")
        const createYer = (createMoment.year() + 543).toString().slice(-2)
        const createTime = `${createMoment.format("D MMM")} ${createYer} เวลา ${createMoment.format("HH:mm")} น.`

        const parsedPreworkDate = updateRepair.preworkDate ? new Date(updateRepair.preworkDate) : null

        const flexMsgGroup = {
            type: 'flex',
            altText: `📢 หมายเลขงาน: ${updateRepair.jobNo} อยู่ระหว่างดำเนินการ`,
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        { type: "text", text: `อัพเดทสถานะงานซ่อม`, size: "lg", color: "#837958", weight: "bold" },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `หมายเลขงาน :`, size: "sm", flex: 2 },
                                { type: "text", text: `${updateRepair.jobNo}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${createTime}`, size: "sm", flex: 4 }
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
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่ดำเนินการ :`, size: "sm", flex: 2 },
                                { type: "text", text: `${acceptDateTH}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `บริษัท :`, size: "sm", flex: 2 },
                                { type: "text", text: `${companyName}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `กลุ่มงาน :`, size: "sm", flex: 2 },
                                { type: "text", text: `${updateRepair.choiceDesc}`, size: "sm", flex: 4 }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `ผู้ดำเนินการ :`, size: "sm", flex: 2 },
                                { type: "text", text: `${technician.name} (${technician.phone})`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `สถานะ :`, size: "sm", color: "#F0B100", weight: "bold", flex: 2 },
                                { type: "text", text: `อยู่ระหว่างดำเนินการ`, size: "sm", wrap: true, color: "#F0B100", weight: "bold", flex: 4 },
                            ]
                        }
                    ]
                },
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
                                label: "กรอกข้อมูลการซ่อม",
                                uri: webDetail
                            },
                        }
                    ]
                }
            }
        }

        const flexMsg = {
            type: 'flex',
            altText: `📢 หมายเลขงาน: ${updateRepair.jobNo} อยู่ระหว่างดำเนินการ`,
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        { type: "text", text: `อัพเดทสถานะแจ้งซ่อม`, size: "lg", weight: "bold", color: "#837958" },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "หมายเลขงาน :", size: "sm", flex: 2 },
                                { type: "text", text: `${updateRepair.jobNo}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${createTime}`, size: "sm", flex: 4 }
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
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "วันที่ดำเนินการ :", size: "sm", flex: 2 },
                                { type: "text", text: `${acceptDateTH}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `กลุ่มงาน :`, size: "sm", flex: 2 },
                                { type: "text", text: `${updateRepair.choiceDesc}`, size: "sm", flex: 4 }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `รายละเอียด :`, size: "sm", flex: 2 },
                                { type: "text", text: `${updateRepair.detail}`, size: "sm", flex: 4 }
                            ]
                        },
                        // { type: "text", text: `บริษัท: ${companyName}`, size: "sm", wrap: true },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "ผู้ดำเนินการ :", size: "sm", flex: 2 },
                                { type: "text", text: `${technician.name} (${technician.phone})`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `สถานะ :`, size: "sm", color: "#F0B100", weight: "bold", flex: 2 },
                                { type: "text", text: `อยู่ระหว่างดำเนินการ`, size: "sm", wrap: true, color: "#F0B100", weight: "bold", flex: 4 },
                            ]
                        }
                    ]
                },
                // footer: {
                //     type: "box",
                //     layout: "vertical",
                //     spacing: "sm",
                //     contents: [
                //         {
                //             style: "secondary",
                //             height: "sm",
                //             color: "#F4F2ED",
                //             action: {
                //                 type: "uri",
                //                 label: "กรอกข้อมูลการซ่อม",
                //                 uri: webDetail
                //             },
                //         }
                //     ]
                // }
            }
        }

        // ✅ ส่งแจ้งเตือนกลุ่มช่าง
        if (groupId) {
            await sendLineNotify(groupId, flexMsgGroup)
        }

        // ✅ แจ้งลูกค้า
        if (updateRepair.customerUserId && updateRepair.customerUserId.trim() !== "") {
            // 👉 กรณีระบุ customerUserId ตรง ๆ
            await sendLineNotify(updateRepair.customerUserId, flexMsg)
        } else if (updateRepair.companyName && updateRepair.companyName.trim() !== "") {
            // 👉 ถ้าไม่มี customerUserId แต่มี companyName ให้ส่งหาทุกคน
            const customersInCompany = await prisma.customer.findMany({
                where: {
                    unit: {
                        company: {
                            companyName: {
                                equals: updateRepair.companyName.trim(),
                                mode: "insensitive" // ไม่สนตัวพิมพ์เล็ก-ใหญ่
                            }
                        }
                    }
                },
                select: {
                    userId: true
                }
            })

            const userIds = customersInCompany.map(c => c.userId).filter(uid => !!uid)

            for (const userId of userIds) {
                await sendLineNotify(userId, flexMsg)
            }
        }

        res.json({ message: "รับงานสำเร็จ", data: updateRepair })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.completeRepair = async (req, res) => {
    try {
        const { id, actionDetail, workStar, techCompleteUserId } = req.body

       // const protocol = req.headers['x-forwarded-proto'] || req.protocol
       // const imageUrls = (req.files || []).map(file => {
       //     return `${protocol}://${req.get('host')}/api/uploads/${file.filename}`
       // })
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https'
        const host = req.get('host')

        // สร้าง URL รูปภาพ พร้อม log เพื่อตรวจสอบ
        const imageUrls = (req.files || []).map(file => {
            const url = `${protocol}://${host}/uploads/${file.filename}`
            console.log("✅ Image URL generated:", url)
            return url
        })



        const repair = await prisma.repair.findFirst({
            where: { id: Number(id) },
            select: { createDate: true, status: true, isDraft: true }
        })

        if (!repair?.createDate) {
            return res.status(400).json({ error: "ไม่พบเวลาแจ้งงาน" })
        }

        if (repair.status === 'completed' && repair.isDraft === false) {
            return res.status(400).json({ message: 'งานนี้ถูกจบแล้ว ไม่สามารถจบซ้ำได้' })
        }

        const completeDate = moment().tz("Asia/Bangkok").toDate()
        const totalMinutes = Math.floor(
            (completeDate.getTime() - new Date(repair.createDate).getTime()) / (1000 * 60)
        )

        const updateRepair = await prisma.repair.update({
            where: { id: Number(id) },
            data: {
                status: 'completed',
                isDraft: false,
                completeDate,
                totalTime: totalMinutes,
                actionDetail,
                workStar: Number(workStar),
                techCompleteUserId,
                images: {
                    create: imageUrls.map(url => ({
                        url,
                        uploadBy: 'tech'
                    }))
                }
            }
        })

        const fullRepair = await prisma.repair.findFirst({
            where: { id: Number(id) },
            include: {
                company: true,
                building: true,
                unit: true,
                customer: true
            }
        })

        const jobNo = fullRepair.jobNo || `#${fullRepair.id}`
        // const createTime = moment(fullRepair.createDate).local("th").format("D MMM YY HH:mm") + " น. "
        // const completeTime = moment(completeDate).locale("th").format("D MMM YY HH:mm") + " น."

        const createMoment = moment(fullRepair.createDate).tz("Asia/Bangkok").locale("th");
        const completeMoment = moment(completeDate).tz("Asia/Bangkok").locale("th");

        const createYear = (createMoment.year() + 543).toString().slice(-2);
        const completeYear = (completeMoment.year() + 543).toString().slice(-2);

        const createTime = `${createMoment.format("D MMM")} ${createYear} เวลา ${createMoment.format("HH:mm")} น.`;
        const completeTime = `${completeMoment.format("D MMM")} ${completeYear} เวลา ${completeMoment.format("HH:mm")} น.`;

        const parsedPreworkDate = updateRepair.preworkDate ? new Date(updateRepair.preworkDate) : null

        const [acceptTech, completeTech] = await Promise.all([
            fullRepair.technicianUserId
                ? prisma.technician.findUnique({ where: { userId: fullRepair.technicianUserId } })
                : null,
            fullRepair.techCompleteUserId
                ? prisma.technician.findUnique({ where: { userId: fullRepair.techCompleteUserId } })
                : null
        ])

        // let technicianText = ""
        // if (
        //     fullRepair.technicianUserId &&
        //     fullRepair.techCompleteUserId &&
        //     fullRepair.technicianUserId === fullRepair.techCompleteUserId
        // ) {
        //     technicianText = `ผู้จบงาน:     ${completeTech?.name || "-"} (${completeTech?.phone})`
        // } else {
        //     technicianText = [
        //         `ผู้รับงาน:     ${acceptTech?.name || "-"} (${acceptTech?.phone})`,
        //         `ผู้จบงาน:     ${completeTech?.name || "-"} (${completeTech?.phone})`
        //     ].join("\n")
        // }

        const technicianBoxes = []

        if (
            fullRepair.technicianUserId &&
            fullRepair.techCompleteUserId &&
            fullRepair.technicianUserId === fullRepair.techCompleteUserId
        ) {
            technicianBoxes.push({
                type: "box",
                layout: "baseline",
                contents: [
                    { type: "text", text: "ผู้จบงาน :", size: "sm", flex: 2 },
                    { type: "text", text: `${completeTech?.name || "-"} (${completeTech?.phone})`, size: "sm", wrap: true, flex: 4 }
                ]
            })
        } else {
            technicianBoxes.push(
                {
                    type: "box",
                    layout: "baseline",
                    contents: [
                        { type: "text", text: "ผู้รับงาน :", size: "sm", flex: 2 },
                        { type: "text", text: `${acceptTech?.name || "-"} (${acceptTech?.phone})`, size: "sm", wrap: true, flex: 4 }
                    ]
                },
                {
                    type: "box",
                    layout: "baseline",
                    contents: [
                        { type: "text", text: "ผู้จบงาน :", size: "sm", flex: 2 },
                        { type: "text", text: `${completeTech?.name || "-"} (${completeTech?.phone})`, size: "sm", wrap: true, flex: 4 }
                    ]
                }
            )
        }

        const messageToCustomer = {
            type: "flex",
            altText: "📌 งานซ่อมของคุณเสร็จเรียบร้อยแล้ว",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "อัพเดทสถานะแจ้งซ่อม", weight: "bold", size: "lg", color: "#837958" },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `หมายเลขงาน :`, size: "sm", flex: 2 },
                                { type: "text", text: `${jobNo}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${createTime}`, size: "sm", flex: 4 },
                            ]
                        },
                        ...(parsedPreworkDate ? [
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    { type: "text", text: `วันนัดเข้าซ่อม:`, size: "sm", flex: 2 },
                                    {
                                        type: "text",
                                        text: `${moment(parsedPreworkDate).locale("th").add(543, "year").format("D MMM")} ${moment(parsedPreworkDate).locale("th").format("YYYY").slice(-2)} เวลา ${moment(parsedPreworkDate).format("HH:mm")} น.`,
                                        size: "sm",
                                        flex: 4
                                    }
                                ]
                            }
                        ] : []),
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่เสร็จสิ้น :`, size: "sm", flex: 2 },
                                { type: "text", text: `${completeTime}`, size: "sm", flex: 4 },
                            ]
                        },
                        // { type: "text", text: `บริษัท: ${fullRepair.company.companyName}`, size: "sm", wrap: true },
                        // { type: "text", text: `อาคาร: ${fullRepair.building.buildingName}`, size: "sm", wrap: true },
                        // { type: "text", text: `สถานที่: ${fullRepair.unit.unitName}`, size: "sm", wrap: true },
                        // { type: "text", text: `ผู้แจ้ง: ${fullRepair.customer?.name || "-"}`, size: "sm", wrap: true },
                        // {
                        //     type: "box",
                        //     layout: "baseline",
                        //     contents: [
                        //         { type: "text", text: technicianBoxes, size: "sm", wrap: true, flex: 2 },
                        //     ]
                        // },
                        ...technicianBoxes,
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `รายละเอียด :`, size: "sm", flex: 2 },
                                { type: "text", text: `${actionDetail || "-"}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `สถานะ :`, size: "sm", color: "#00B900", flex: 2 },
                                { type: "text", text: `เสร็จสิ้น`, size: "sm", wrap: true, color: "#00B900", flex: 4 },
                            ]
                        },
                        // ...(imageUrls.length > 0
                        //     ? imageUrls.map(url => ({
                        //         type: "image",
                        //         url,
                        //         size: "full",
                        //         aspectRatio: "16:9",
                        //         aspectMode: "cover",
                        //         margin: "md"
                        //     }))
                        //     : [])

                        ...(imageUrls.length > 0
                            ? [
                                ...imageUrls.slice(0, -1).map(url => ({
                                    type: "image",
                                    url,
                                    size: "full",
                                    aspectRatio: "16:9",
                                    aspectMode: "cover",
                                    margin: "md"
                                })),
                                {
                                    type: "text",
                                    text: "ลายเซ็น",
                                    size: "sm",
                                    // weight: "bold",
                                    margin: "md"
                                },
                                {
                                    type: "image",
                                    url: imageUrls[imageUrls.length - 1],
                                    size: "full",
                                    aspectRatio: "16:9",
                                    aspectMode: "cover",
                                    margin: "md"
                                }
                            ]
                            : [])

                    ]
                }
            }
        }

        const messageToGroup = {
            type: "flex",
            altText: "✅ งานซ่อมเสร็จแล้ว",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "อัพเดทสถานะงานซ่อม", weight: "bold", size: "lg", color: "#837958" },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `หมายเลขงาน :`, size: "sm", flex: 2 },
                                { type: "text", text: `${jobNo}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${createTime}`, size: "sm", flex: 4 },
                            ]
                        },
                        ...(parsedPreworkDate ? [
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    { type: "text", text: `วันนัดเข้าซ่อม:`, size: "sm", flex: 2 },
                                    {
                                        type: "text",
                                        text: `${moment(parsedPreworkDate).locale("th").add(543, "year").format("D MMM")} ${moment(parsedPreworkDate).locale("th").format("YYYY").slice(-2)} เวลา ${moment(parsedPreworkDate).format("HH:mm")} น.`,
                                        size: "sm",
                                        flex: 4
                                    }
                                ]
                            }
                        ] : []),
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `วันที่เสร็จ :`, size: "sm", flex: 2 },
                                { type: "text", text: `${completeTime}`, size: "sm", flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `บริษัท :`, size: "sm", flex: 2 },
                                { type: "text", text: `${fullRepair.company.companyName}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `อาคาร :`, size: "sm", flex: 2 },
                                { type: "text", text: `${fullRepair.building.buildingName}, ${fullRepair.unit.unitName}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        // {
                        //     type: "box",
                        //     layout: "baseline",
                        //     contents: [
                        //         { type: "text", text: `สถานที่ :`, size: "sm", flex: 2 },
                        //         { type: "text", text: `${fullRepair.unit.unitName}`, size: "sm", wrap: true, flex: 4 },
                        //     ]
                        // },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `ผู้แจ้ง :`, size: "sm", flex: 2 },
                                { type: "text", text: `${fullRepair.customer?.name || "-"} (${fullRepair.customer?.phone || "-"})`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        // {
                        //     type: "box",
                        //     layout: "baseline",
                        //     contents: [
                        //         { type: "text", text: technicianBoxes, size: "sm", wrap: true, color: "#666666", flex: 2 },
                        //     ]
                        // },
                        ...technicianBoxes,
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `รายละเอียด :`, size: "sm", flex: 2 },
                                { type: "text", text: `${actionDetail || "-"}`, size: "sm", wrap: true, flex: 4 },
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: `สถานะ :`, size: "sm", color: "#00B900", flex: 2 },
                                { type: "text", text: `เสร็จสิ้น`, size: "sm", wrap: true, color: "#00B900", flex: 4 },
                            ]
                        },
                        // ...(imageUrls.length > 0
                        //     ? imageUrls.map(url => ({
                        //         type: "image",
                        //         url,
                        //         size: "full",
                        //         aspectRatio: "16:9",
                        //         aspectMode: "cover",
                        //         margin: "md"
                        //     }))
                        //     : [])

                        ...(imageUrls.length > 0
                            ? [
                                ...imageUrls.slice(0, -1).map(url => ({
                                    type: "image",
                                    url,
                                    size: "full",
                                    aspectRatio: "16:9",
                                    aspectMode: "cover",
                                    margin: "md"
                                })),
                                {
                                    type: "text",
                                    text: "ลายเซ็น",
                                    size: "sm",
                                    // weight: "bold",
                                    margin: "md"
                                },
                                {
                                    type: "image",
                                    url: imageUrls[imageUrls.length - 1],
                                    size: "full",
                                    aspectRatio: "16:9",
                                    aspectMode: "cover",
                                    margin: "md"
                                }
                            ]
                            : [])

                    ]
                }
            }
        }

        // ✅ ส่งให้ลูกค้าหรือทุกคนในบริษัท
        if (fullRepair.customerUserId && fullRepair.customerUserId.trim() !== "") {
            await sendLineNotify(fullRepair.customerUserId, messageToCustomer)
        } else if (fullRepair.companyName && fullRepair.companyName.trim() !== "") {
            const customers = await prisma.customer.findMany({
                where: {
                    unit: {
                        company: {
                            companyName: {
                                equals: fullRepair.companyName.trim(),
                                mode: 'insensitive'
                            }
                        }
                    }
                },
                select: {
                    userId: true
                }
            })

            for (const user of customers) {
                if (user.userId) {
                    await sendLineNotify(user.userId, messageToCustomer)
                }
            }
        }

        await sendLineNotify(fullRepair.building.groupId, messageToGroup)

        return res.json({
            message: 'บันทึกงานเสร็จสมบูรณ์และส่งแจ้งเตือนแล้ว',
            data: updateRepair
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getRelatedByUnit = async (req, res) => {
    const { unitName } = req.params;
    try {
        const unit = await prisma.units.findFirst({
            where: { unitName, isDelete: false },
            include: {
                company: {
                    include: {
                        building: true,
                    },
                },
            },
        });

        if (!unit) return res.status(404).json({ message: "ไม่พบข้อมูล Unit" });

        res.json({
            unit: unit.unitName,
            company: unit.company.companyName,
            building: unit.company.building.buildingName,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

exports.getRelatedByCompany = async (req, res) => {
    const { companyName } = req.params;
    try {
        const company = await prisma.company.findFirst({
            where: { companyName, isDelete: false },
            include: {
                building: true,
                units: {
                    where: { isDelete: false },
                },
            },
        });

        if (!company) return res.status(404).json({ message: "ไม่พบข้อมูล Company" });

        res.json({
            company: company.companyName,
            building: company.building.buildingName,
            units: company.units.map((u) => u.unitName),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}

// exports.getTechnicianReport = async (req, res) => {
//     try {
//         // 1. ดึง groupBy งานที่ทำเสร็จแล้ว
//         const techniciansReport = await prisma.repair.groupBy({
//             by: ['techCompleteUserId'],
//             where: {
//                 status: 'completed',
//                 techCompleteUserId: { not: null }
//             },
//             _count: {
//                 _all: true
//             }
//         });

//         // 2. ดึงรายชื่อช่างทุกคน
//         const allTechnicians = await prisma.technician.findMany({
//             where: {
//                 isDelete: false // ถ้ามี soft delete ด้วย
//             },
//             include: {
//                 techBuilds: {
//                     include: { building: true }
//                 }
//             }
//         });

//         // 3. Map ช่างทุกคน ถ้าไม่มีใน groupBy ให้เป็น 0
//         const reportWithDetails = allTechnicians.map(technician => {
//             const found = techniciansReport.find(
//                 item => item.techCompleteUserId === technician.userId
//             );

//             return {
//                 techCompleteUserId: technician.userId,
//                 technicianName: technician.name || 'Unknown',
//                 completedJobs: found ? found._count._all : 0,
//                 buildings: [
//                     ...new Set(
//                         technician.techBuilds.map(tb => tb.building.buildingName)
//                     )
//                 ] || []
//             };
//         });

//         res.json({
//             message: "Get technician report success",
//             data: reportWithDetails
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// exports.getTechnicianReport = async (req, res) => {
//     try {
//         const { startDate, endDate } = req.query;

//         // ฟิลเตอร์วันที่
//         const dateFilter = {};
//         if (startDate && endDate) {
//             dateFilter.completeDate = {
//                 gte: new Date(`${startDate}T00:00:00.000Z`),
//                 lte: new Date(`${endDate}T23:59:59.999Z`)
//             };
//         }

//         // 1. Group by งานที่จบ (techCompleteUserId)
//         const completedJobs = await prisma.repair.groupBy({
//             by: ['techCompleteUserId'],
//             where: {
//                 status: 'completed',
//                 techCompleteUserId: { not: null },
//                 ...dateFilter
//             },
//             _count: {
//                 _all: true
//             },
//             _avg: {
//                 workStar: true
//             }
//         });

//         // 2. Group by งานที่รับ (techAcceptUserId)
//         const acceptedJobs = await prisma.repair.groupBy({
//             by: ['techAcceptUserId'],
//             where: {
//                 techAcceptUserId: { not: null },
//                 ...dateFilter
//             },
//             _count: {
//                 _all: true
//             }
//         });

//         // 3. ดึงรายชื่อช่างทั้งหมด
//         const allTechnicians = await prisma.technician.findMany({
//             where: {
//                 isDelete: false
//             },
//             include: {
//                 techBuilds: {
//                     include: { building: true }
//                 }
//             }
//         });

//         // 4. รวมข้อมูล
//         const reportWithDetails = allTechnicians.map(technician => {
//             const accept = acceptedJobs.find(a => a.techAcceptUserId === technician.userId);
//             const complete = completedJobs.find(c => c.techCompleteUserId === technician.userId);

//             const acceptedCount = accept ? accept._count._all : 0;
//             const completedCount = complete ? complete._count._all : 0;

//             const total = acceptedCount + (completedCount - (accept?.techAcceptUserId === complete?.techCompleteUserId ? completedCount : 0));
//             const successRate = total > 0 ? parseFloat(((completedCount / total) * 100).toFixed(2)) : null;

//             return {
//                 techUserId: technician.userId,
//                 technicianName: technician.name || 'Unknown',
//                 acceptedJobs: acceptedCount,
//                 completedJobs: completedCount,
//                 successRate: successRate, // หน่วย %
//                 averageStar: complete?._avg?.workStar ? parseFloat(complete._avg.workStar.toFixed(2)) : null,
//                 buildings: [
//                     ...new Set(technician.techBuilds.map(tb => tb.building.buildingName))
//                 ]
//             };
//         });

//         res.json({
//             message: "Get technician report success",
//             data: reportWithDetails
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

exports.getTechnicianReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`);
            const end = new Date(`${endDate}T23:59:59.999Z`);
            dateFilter = {
                completeDate: {
                    gte: start,
                    lte: end,
                },
            };
        }

        // 1. Group by งานที่จบ (techCompleteUserId)
        const completedJobs = await prisma.repair.groupBy({
            by: ['techCompleteUserId'],
            where: {
                status: 'completed',
                techCompleteUserId: { not: null },
                ...dateFilter,
            },
            _count: {
                _all: true,
            },
            _avg: {
                workStar: true,
            },
        });

        // 2. Group by งานที่รับ (techAcceptUserId)
        const acceptedJobs = await prisma.repair.groupBy({
            by: ['techAcceptUserId'],
            where: {
                techAcceptUserId: { not: null },
                ...dateFilter,
            },
            _count: {
                _all: true,
            },
        });

        // 3. ดึงงานทั้งหมดในช่วงวันที่ เพื่อใช้แยกตามวัน/สัปดาห์/เดือน
        const repairs = await prisma.repair.findMany({
            where: {
                ...dateFilter,
                OR: [
                    { techAcceptUserId: { not: null } },
                    { techCompleteUserId: { not: null } },
                ],
            },
            select: {
                techAcceptUserId: true,
                techCompleteUserId: true,
                completeDate: true,
                status: true,
                workStar: true,
            },
        });

        // 4. ดึงรายชื่อช่างทั้งหมด
        const allTechnicians = await prisma.technician.findMany({
            where: { isDelete: false },
            include: {
                techBuilds: {
                    include: { building: true },
                },
            },
        });

        // 5. เตรียม map สำหรับเก็บข้อมูลรายวัน/สัปดาห์/เดือน
        const weeklyMap = {};
        const dayOfMonthMap = {};
        const monthMap = {};

        // สร้างค่า default สำหรับวันในเดือน และเดือนในปี
        const defaultWeekdays = {
            Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0,
            Friday: 0, Saturday: 0, Sunday: 0,
        };
        const defaultDaysInMonth = {};
        for (let i = 1; i <= 31; i++) {
            defaultDaysInMonth[`day${i}`] = 0;
        }
        const defaultMonths = {
            Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
            Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
        };

        // 6. นับงานตามวัน/สัปดาห์/เดือน โดยแยกตาม techAcceptUserId
        repairs.forEach(item => {
            const techId = item.techAcceptUserId || item.techCompleteUserId || 'unknown';
            const date = new Date(item.completeDate || new Date());

            // วันในสัปดาห์
            const weekday = date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Asia/Bangkok' });
            // วันที่ในเดือน
            const day = parseInt(date.toLocaleString('en-US', { day: '2-digit', timeZone: 'Asia/Bangkok' }), 10);
            // เดือนย่อ
            const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'Asia/Bangkok' });

            // Init maps ถ้ายังไม่มี
            if (!weeklyMap[techId]) weeklyMap[techId] = { ...defaultWeekdays };
            if (!dayOfMonthMap[techId]) dayOfMonthMap[techId] = { ...defaultDaysInMonth };
            if (!monthMap[techId]) monthMap[techId] = { ...defaultMonths };

            // นับเพิ่ม
            if (weeklyMap[techId][weekday] !== undefined) weeklyMap[techId][weekday]++;
            const dayKey = `day${day}`;
            dayOfMonthMap[techId][dayKey]++;
            if (monthMap[techId][month] !== undefined) monthMap[techId][month]++;
        });

        // 7. รวมข้อมูลรายช่าง
        const reportWithDetails = allTechnicians.map(technician => {
            const techId = technician.userId;
//            const accept = acceptedJobs.find(a => a.techAcceptUserId === techId);
//            const complete = completedJobs.find(c => c.techCompleteUserId === techId);
//
//            const acceptedCount = accept ? accept._count._all : 0;
//            const completedCount = complete ? complete._count._all : 0;

//            const total = acceptedCount + (completedCount - (accept?.techAcceptUserId === complete?.techCompleteUserId ? completedCount : 0));
//          const successRate = total > 0 ? parseFloat(((completedCount / total) * 100).toFixed(2)) : null;
// A = งานที่ตัวเองรับมา
            const A = repairs.filter(r => r.techAcceptUserId === techId).length;

            // B = งานที่รับเองและจบเอง
            const B = repairs.filter(r =>
                r.techAcceptUserId === techId &&
                r.techCompleteUserId === techId &&
                r.status === 'completed'
            ).length;

            // C = งานที่เราไปจบให้คนอื่น
            const C = repairs.filter(r =>
                r.techAcceptUserId !== techId &&
                r.techCompleteUserId === techId &&
                r.status === 'completed'
            ).length;

            // D = งานที่คนอื่นเอาของเราไปจบ
            const D = repairs.filter(r =>
                r.techAcceptUserId === techId &&
                r.techCompleteUserId !== techId &&
                r.status === 'completed'
            ).length;

            const denominator = A + C - D;
            const numerator = B + C;

            const successRate = denominator > 0
                ? parseFloat(((numerator / denominator) * 100).toFixed(2))
                : null;

            const complete = completedJobs.find(c => c.techCompleteUserId === techId);

//const successRate = acceptedCount > 0 ? parseFloat(((completedCount / acceptedCount) * 100).toFixed(2)): null;
            return {
                techUserId: techId,
                technicianName: technician.name || 'Unknown',
         //       acceptedJobs: acceptedCount,
         //       completedJobs: completedCount,
                 acceptedJobs: A,                            // เปลี่ยนจาก acceptedCount
                 completedJobs: B + C,                       // เปลี่ยนจาก completedCoun
                tekenFromOtherCount: C, //งานที่เราไปจบให้คนอื่น
		takenByOtherCount: D, //งานที่คนอื่นจบให้เรา
                successRate,
                averageStar: complete?._avg?.workStar ? parseFloat(complete._avg.workStar.toFixed(2)) : null,
                buildings: [...new Set(technician.techBuilds.map(tb => tb.building.buildingName))],
                // ข้อมูลแยกตามวัน/สัปดาห์/เดือน
                weekly: weeklyMap[techId] || defaultWeekdays,
                daily: dayOfMonthMap[techId] || defaultDaysInMonth,
                monthly: monthMap[techId] || defaultMonths,
            };
        });

        res.json({
            message: "Get technician report success",
            data: reportWithDetails,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//exports.getTechReportById = async (req, res) => {
  //  try {
    //    const { userId } = req.params;

        // งานที่ช่างรับ
      //  const acceptRepair = await prisma.repair.findMany({
        //    where: {
          //      techAcceptUserId: userId,
            //    isDraft: false
          //  },
          //  include: {
            //    customer: true,
             //   company: true,
            //    building: true,
            //    unit: true,
            //    images: true
          //  }
      //  });

        // งานที่ช่างทำเสร็จ
      //  const completedRepair = await prisma.repair.findMany({
       //     where: {
         //       techCompleteUserId: userId,
           //     isDraft: false
          //  },
         //   include: {
           //     customer: true,
            //    company: true,
            //    building: true,
            //    unit: true,
              //  images: true
          //  }
      //  });

        // ข้อมูลช่าง + ตึกที่สังกัด (TechBuild)
      //  const technician = await prisma.technician.findUnique({
        //    where: {
          //      userId: userId
          //  },
         //   include: {
         //       techBuilds: {
          //          include: {
           //             building: true
             //       }
             //   }
          //  }
      //  });

      //  const acceptedCount = acceptRepair.length
      //  const completedCount = completedRepair.length

     //   const percentComplete = acceptedCount > 0
       //     ? Math.round((completedCount / acceptedCount) * 100)
         //   : 0;

//	const validWorkStars = completedRepair
  //       .map((repair) => repair.workStar)
    //     .filter((star) => star !== null && star !== undefined);

      //  const totalWorkStar = validWorkStars.reduce((sum, star) => sum + star, 0);

      //  const averageWorkStar =
       //   validWorkStars.length > 0
       //   ? parseFloat((totalWorkStar / validWorkStars.length).toFixed(2))
       //   : 0;

//	console.log(averageWorkStar);

  //      res.json({
    //        message: "Get tech report by id success",
      //      data: {
        //        technician: {
          //          name: technician?.name || '',
            //        phone: technician?.phone || '',
              //      role: technician?.role || '',
                //    userId: technician?.userId || '',
		//    averageWorkStar,
                  //  buildings: [
                   //     ...new Set(
                     //       technician.techBuilds.map(tb => tb.building.buildingName)
                     //   )
                  //  ] || []
              //  },
              //  accepted: acceptRepair,
             //   completed: completedRepair,
             //   summary: {
              //      acceptedCount,
                //    completedCount,
              //      percentComplete
             //   }
          //  }
      //  });

  //  } catch (error) {
    //    console.log(error);
      //  res.status(500).json({ message: "Server Error" });
  //  }
//};

exports.getTechReportById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      dateFilter = {
        completeDate: {
          gte: start,
          lte: end,
        },
      };
    }

    // งานที่รับ
    const acceptRepair = await prisma.repair.findMany({
      where: {
        techAcceptUserId: userId,
        isDraft: false,
        ...dateFilter, // กรองตาม completeDate เหมือน getTechnicianReport
      },
      include: {
        customer: true,
        company: true,
        building: true,
        unit: true,
        images: true,
      },
    });

    // งานที่จบ
    const completedRepair = await prisma.repair.findMany({
      where: {
        techCompleteUserId: userId,
        isDraft: false,
        status: 'completed', // ต้องเป็นงานที่จบเท่านั้น
        ...dateFilter,
      },
      include: {
        customer: true,
        company: true,
        building: true,
        unit: true,
        images: true,
      },
    });

    // ค่าเฉลี่ยดาวจากงานที่จบ
    const averageStarResult = await prisma.repair.aggregate({
      _avg: { workStar: true },
      where: {
        techCompleteUserId: userId,
        status: 'completed',
        workStar: { not: null },
        ...dateFilter,
      },
    });

    const technician = await prisma.technician.findUnique({
      where: { userId },
      include: { techBuilds: { include: { building: true } } },
    });

    const acceptedCount = acceptRepair.length;
    const completedCount = completedRepair.length;
    const percentComplete =
      acceptedCount > 0 ? Math.round((completedCount / acceptedCount) * 100) : 0;

    res.json({
      message: "Get tech report by id success",
      data: {
        technician: {
          name: technician?.name || "",
          phone: technician?.phone || "",
          role: technician?.role || "",
          userId: technician?.userId || "",
          buildings:
            [...new Set(technician?.techBuilds.map((tb) => tb.building.buildingName))] || [],
        },
        accepted: acceptRepair,
        completed: completedRepair,
        summary: {
          acceptedCount,
          completedCount,
          percentComplete,
          averageStar: averageStarResult._avg.workStar
            ? parseFloat(averageStarResult._avg.workStar.toFixed(2))
            : null,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

<<<<<<< HEAD

exports.deleteContractorFake = async (req, res) => {
    try {
        const { id } = req.params
        const contractor = await prisma.contractorNote.update({
=======
exports.deleteContractorFake = async (req, res) => {
    try {
        const { id } = req.params
        const contractor = await prisma.contractor.update({
>>>>>>> 4b7db1c6b7d3f09a54201c6f3fb661487de65354
            where: {
                id: Number(id)
            },
            data: {
                isDelete: true,
                fakeDelete: true
            }
        })
        res.json({ message: "Delete contractor success", data: contractor })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> 4b7db1c6b7d3f09a54201c6f3fb661487de65354
