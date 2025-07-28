const prisma = require('../config/prisma')
const { fromZonedTime, toDate } = require('date-fns-tz')


// exports.getDashboard = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     let whereDateFilter = {};

//     if (startDate && endDate) {
//       // ✅ แปลงเวลาไทย (Asia/Bangkok) → UTC
//       const tz = 'Asia/Bangkok';

//       const start = toDate(fromZonedTime(`${startDate} 00:00:00`, 'Asia/Bangkok'))
//       const end = toDate(fromZonedTime(`${endDate} 23:59:59`, 'Asia/Bangkok'))

//       whereDateFilter = {
//         createDate: {
//           gte: start,
//           lte: end
//         }
//       };
//     }

//     // ✅ 1) จำนวนงานตาม status
//     const statusCounts = await prisma.repair.groupBy({
//       by: ['status'],
//       where: whereDateFilter,
//       _count: { status: true }
//     });

//     const totalJobs = await prisma.repair.count({
//       where: whereDateFilter
//     });

//     // ✅ 2) จำนวนงานตาม RepairChoice
//     const choicesCounts = await prisma.repairChoiceOnRepair.groupBy({
//       by: ['repairChoiceId'],
//       where: {
//         repair: whereDateFilter
//       },
//       _count: { repairId: true }
//     });

//     const choicesDetails = await Promise.all(
//       choicesCounts.map(async (choice) => {
//         const choiceInfo = await prisma.repairChoice.findUnique({
//           where: { id: choice.repairChoiceId }
//         });
//         return {
//           choiceId: choice.repairChoiceId,
//           choiceName: choiceInfo?.choiceName,
//           count: choice._count.repairId
//         };
//       })
//     );

//     // ✅ 3) Top 10 บริษัทแจ้งซ่อมมากที่สุด
//     const topCompanies = await prisma.repair.groupBy({
//       by: ['companyName'],
//       where: whereDateFilter,
//       _count: { id: true },
//       orderBy: {
//         _count: { id: 'desc' }
//       },
//       take: 10
//     });

//     // ✅ 4) 10 งานใหม่ล่าสุด
//     const latestRepairs = await prisma.repair.findMany({
//       where: whereDateFilter,
//       orderBy: { createDate: 'desc' },
//       take: 10,
//       select: {
//         id: true,
//         jobNo: true,
//         detail: true,
//         status: true,
//         createDate: true,
//         companyName: true,
//         choices: {
//           include: {
//             repairChoice: true
//           }
//         }
//       }
//     });

//     return res.json({
//       statusCounts,
//       totalJobs,
//       choicesDetails,
//       topCompanies,
//       latestRepairs
//     });

//   } catch (error) {
//     console.error('Dashboard Error:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// exports.getDashboard = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     let whereDateFilter = {};

//     if (startDate && endDate) {
//       // ✅ แปลงเวลาไทย (Asia/Bangkok) → UTC
//       const tz = 'Asia/Bangkok';

//       const start = toDate(fromZonedTime(`${startDate} 00:00:00`, tz));
//       const end = toDate(fromZonedTime(`${endDate} 23:59:59`, tz));

//       whereDateFilter = {
//         createDate: {
//           gte: start,
//           lte: end,
//         },
//       };
//     }

//     // ✅ 1) จำนวนงานตาม status
//     const statusCounts = await prisma.repair.groupBy({
//       by: ['status'],
//       where: whereDateFilter,
//       _count: { status: true },
//     });

//     const totalJobs = await prisma.repair.count({
//       where: whereDateFilter,
//     });

//     // ✅ 2) จำนวนงานตาม RepairChoice
//     // const choicesCounts = await prisma.repairChoiceOnRepair.groupBy({
//     //   by: ['repairChoiceId'],
//     //   where: {
//     //     repair: whereDateFilter,
//     //   },
//     //   _count: { repairId: true },
//     // });

//     // const choicesDetails = await Promise.all(
//     //   choicesCounts.map(async (choice) => {
//     //     const choiceInfo = await prisma.repairChoice.findUnique({
//     //       where: { id: choice.repairChoiceId },
//     //     });
//     //     return {
//     //       choiceId: choice.repairChoiceId,
//     //       choiceName: choiceInfo?.choiceName,
//     //       count: choice._count.repairId,
//     //     };
//     //   })
//     // );

//     // ✅ ดึงข้อมูลแบบ findMany
//     const choicesCountsRaw = await prisma.repairChoiceOnRepair.findMany({
//       where: {
//         repair: whereDateFilter,
//       },
//       select: {
//         repairChoiceId: true,
//         repair: {
//           select: { status: true },
//         },
//       },
//     });

//     // ✅ GroupBy ด้วย JS
//     const choicesMap = {};

//     for (const item of choicesCountsRaw) {
//       const choiceId = item.repairChoiceId;
//       const status = item.repair.status;

//       if (!choicesMap[choiceId]) {
//         const choiceInfo = await prisma.repairChoice.findUnique({
//           where: { id: choiceId },
//         });

//         choicesMap[choiceId] = {
//           choiceId,
//           choiceName: choiceInfo?.choiceName || '',
//           pending: 0,
//           in_progress: 0,
//           completed: 0,
//         };
//       }

//       if (status === 'pending') choicesMap[choiceId].pending += 1;
//       else if (status === 'in_progress') choicesMap[choiceId].in_progress += 1;
//       else if (status === 'completed') choicesMap[choiceId].completed += 1;
//     }

//     const choicesDetails = Object.values(choicesMap);


//     // ✅ 3) Top 10 บริษัทแจ้งซ่อมมากที่สุด
//     const topCompanies = await prisma.repair.groupBy({
//       by: ['companyName'],
//       where: whereDateFilter,
//       _count: { id: true },
//       orderBy: {
//         _count: { id: 'desc' },
//       },
//       take: 10,
//     });

//     // ✅ 4) 10 งานใหม่ล่าสุด + fallback companyName จาก building.companies
//     const latestRepairsRaw = await prisma.repair.findMany({
//       where: whereDateFilter,
//       orderBy: { createDate: 'desc' },
//       take: 10,
//       select: {
//         id: true,
//         jobNo: true,
//         detail: true,
//         status: true,
//         createDate: true,
//         companyName: true,
//         building: {
//           select: {
//             buildingName: true,
//             companies: {
//               select: {
//                 companyName: true,
//               },
//               take: 1, // เอาแค่บริษัทแรก
//             },
//           },
//         },
//         choices: {
//           include: {
//             repairChoice: true,
//           },
//         },
//       },
//     });

//     // ✅ Fallback: ถ้า companyName ว่าง → เอาจาก building.companies[0].companyName
//     const latestRepairs = latestRepairsRaw.map((repair) => {
//       let companyName = repair.companyName;
//       if (!companyName && repair.building?.companies?.length > 0) {
//         companyName = repair.building.companies[0].companyName || null;
//       }
//       return {
//         ...repair,
//         companyName,
//       };
//     });

//     return res.json({
//       statusCounts,
//       totalJobs,
//       choicesDetails,
//       topCompanies,
//       latestRepairs,
//     });
//   } catch (error) {
//     console.error('Dashboard Error:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// exports.getDashboard = async (req, res) => {
//   try {
//     const { startDate, endDate, buildingName } = req.query;

//     // ✅ สร้าง whereFilter รวม date และ buildingName
//     let whereFilter = {};

//     if (startDate && endDate) {
//       const tz = 'Asia/Bangkok';
//       const start = toDate(fromZonedTime(`${startDate} 00:00:00`, tz));
//       const end = toDate(fromZonedTime(`${endDate} 23:59:59`, tz));

//       whereFilter.createDate = {
//         gte: start,
//         lte: end,
//       };
//     }

//     if (buildingName) {
//       whereFilter.building = {
//         buildingName: buildingName,
//       };
//     }

//     // ✅ 1) จำนวนงานตาม status
//     const statusCounts = await prisma.repair.groupBy({
//       by: ['status'],
//       where: whereFilter,
//       _count: { status: true },
//     });

//     const totalJobs = await prisma.repair.count({
//       where: whereFilter,
//     });

//     // ✅ 2) จำนวนงานตาม RepairChoice
//     const choicesCountsRaw = await prisma.repairChoiceOnRepair.findMany({
//       where: {
//         repair: whereFilter,
//       },
//       select: {
//         repairChoiceId: true,
//         repair: {
//           select: { status: true },
//         },
//       },
//     });

//     const choicesMap = {};

//     for (const item of choicesCountsRaw) {
//       const choiceId = item.repairChoiceId;
//       const status = item.repair.status;

//       if (!choicesMap[choiceId]) {
//         const choiceInfo = await prisma.repairChoice.findUnique({
//           where: { id: choiceId },
//         });

//         choicesMap[choiceId] = {
//           choiceId,
//           choiceName: choiceInfo?.choiceName || '',
//           pending: 0,
//           in_progress: 0,
//           completed: 0,
//         };
//       }

//       if (status === 'pending') choicesMap[choiceId].pending += 1;
//       else if (status === 'in_progress') choicesMap[choiceId].in_progress += 1;
//       else if (status === 'completed') choicesMap[choiceId].completed += 1;
//     }

//     const choicesDetails = Object.values(choicesMap);

//     // ✅ 3) Top 10 บริษัทแจ้งซ่อมมากที่สุด
//     const topCompanies = await prisma.repair.groupBy({
//       by: ['companyName'],
//       where: whereFilter,
//       _count: { id: true },
//       orderBy: {
//         _count: { id: 'desc' },
//       },
//       take: 10,
//     });

//     // ✅ 4) 10 งานใหม่ล่าสุด
//     const latestRepairsRaw = await prisma.repair.findMany({
//       where: whereFilter,
//       orderBy: { createDate: 'desc' },
//       take: 10,
//       select: {
//         id: true,
//         jobNo: true,
//         detail: true,
//         status: true,
//         createDate: true,
//         companyName: true,
//         building: {
//           select: {
//             buildingName: true,
//             companies: {
//               select: {
//                 companyName: true,
//               },
//               take: 1,
//             },
//           },
//         },
//         choices: {
//           include: {
//             repairChoice: true,
//           },
//         },
//       },
//     });

//     // ✅ Fallback: ถ้า companyName ว่าง → เอาจาก building.companies[0].companyName
//     const latestRepairs = latestRepairsRaw.map((repair) => {
//       let companyName = repair.companyName;
//       if (!companyName && repair.building?.companies?.length > 0) {
//         companyName = repair.building.companies[0].companyName || null;
//       }
//       return {
//         ...repair,
//         companyName,
//       };
//     });

//     return res.json({
//       statusCounts,
//       totalJobs,
//       choicesDetails,
//       topCompanies,
//       latestRepairs,
//     });
//   } catch (error) {
//     console.error('Dashboard Error:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

exports.getDashboard = async (req, res) => {
  try {
    const { startDate, endDate, buildingName } = req.query;

    // ✅ สร้าง whereFilter รวม date และ buildingName
    let whereFilter = {};

    if (startDate && endDate) {
      const tz = 'Asia/Bangkok';
      const start = toDate(fromZonedTime(`${startDate} 00:00:00`, tz));
      const end = toDate(fromZonedTime(`${endDate} 23:59:59`, tz));

      whereFilter.createDate = {
        gte: start,
        lte: end,
      };
    }

    if (buildingName) {
      whereFilter.building = {
        buildingName: buildingName,
      };
    }

    // ✅ 1) จำนวนงานตาม status
    const statusCounts = await prisma.repair.groupBy({
      by: ['status'],
      where: whereFilter,
      _count: { status: true },
    });

    const totalJobs = await prisma.repair.count({
      where: whereFilter,
    });

    // ✅ 2) จำนวนงานตาม RepairChoice
    const choicesCountsRaw = await prisma.repairChoiceOnRepair.findMany({
      where: {
        repair: whereFilter,
      },
      select: {
        repairChoiceId: true,
        repair: {
          select: { status: true },
        },
      },
    });

    const choicesMap = {};

    for (const item of choicesCountsRaw) {
      const choiceId = item.repairChoiceId;
      const status = item.repair.status;

      if (!choicesMap[choiceId]) {
        const choiceInfo = await prisma.repairChoice.findUnique({
          where: { id: choiceId },
        });

        choicesMap[choiceId] = {
          choiceId,
          choiceName: choiceInfo?.choiceName || '',
          pending: 0,
          in_progress: 0,
          completed: 0,
        };
      }

      if (status === 'pending') choicesMap[choiceId].pending += 1;
      else if (status === 'in_progress') choicesMap[choiceId].in_progress += 1;
      else if (status === 'completed') choicesMap[choiceId].completed += 1;
    }

    const choicesDetails = Object.values(choicesMap);

    // ✅ 3) Top 10 บริษัทแจ้งซ่อมมากที่สุด (จาก companyId → companyName)
    const topCompanyIds = await prisma.repair.groupBy({
      by: ['companyId'],
      where: whereFilter,
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: 10,
    });

    const companyIds = topCompanyIds.map(c => c.companyId);

    const companies = await prisma.company.findMany({
      where: {
        id: { in: companyIds },
        isDelete: false,
      },
      select: {
        id: true,
        companyName: true,
      },
    });

    const topCompanies = topCompanyIds.map(c => {
      const company = companies.find(co => co.id === c.companyId);
      return {
        companyId: c.companyId,
        companyName: company?.companyName || 'ไม่ทราบชื่อบริษัท',
        count: c._count.id,
      };
    });

    // ✅ 4) 10 งานใหม่ล่าสุด
    const latestRepairsRaw = await prisma.repair.findMany({
      where: whereFilter,
      orderBy: { createDate: 'desc' },
      take: 10,
      select: {
        id: true,
        jobNo: true,
        detail: true,
        status: true,
        createDate: true,
        companyName: true,
        building: {
          select: {
            buildingName: true,
            companies: {
              select: {
                companyName: true,
              },
              take: 1,
            },
          },
        },
        choices: {
          include: {
            repairChoice: true,
          },
        },
      },
    });

    // ✅ Fallback: ถ้า companyName ว่าง → เอาจาก building.companies[0].companyName
    const latestRepairs = latestRepairsRaw.map((repair) => {
      let companyName = repair.companyName;
      if (!companyName && repair.building?.companies?.length > 0) {
        companyName = repair.building.companies[0].companyName || null;
      }
      return {
        ...repair,
        companyName,
      };
    });

    return res.json({
      statusCounts,
      totalJobs,
      choicesDetails,
      topCompanies,
      latestRepairs,
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
