const cron = require('node-cron');
const moment = require('moment-timezone');
require('moment/locale/th');
moment.locale('th');

const prisma = require('../config/prisma');
const { sendLineNotify } = require('../utils/line');

// ✅ ฟอร์แมตวันที่ไทย เช่น 3 ก.ค. 68 (ปีพุทธศักราช)
function formatThaiDate(date) {
  const thaiDate = moment(date).tz('Asia/Bangkok');
  const buddhistYear = thaiDate.year() + 543;
  return thaiDate.format('D MMM') + ' ' + buddhistYear.toString().slice(-2);
}

// ✅ ฟอร์แมตเวลาไทย เช่น 19:00 น.
function formatThaiTime(date) {
  return moment(date).tz('Asia/Bangkok').format('HH:mm') + ' น.';
}

// ✅ ฟังก์ชันสร้างข้อความสรุป
function createSummaryByStatusMessage(repairs, buildingName, accumulated) {
  const now = new Date();
  const dateStr = formatThaiDate(now);
  const timeStr = formatThaiTime(now);

  if (repairs.length === 0) {
    return (
      `สรุปงานวันนี้ ${dateStr} เวลา ${timeStr}\n` +
      `อาคาร: ${buildingName}\n\n` +
      `ไม่มีงานแจ้งซ่อม` + '\n' +
      `ยอดงานคงเหลือสะสม: ${accumulated.total} งาน\n` +
      `  - รอดำเนินการ: ${accumulated.pending}\n` +
      `  - อยู่ระหว่างดำเนินการ: ${accumulated.inProgress}`
    );
  }

  const waitingCount = repairs.filter(r => r.status === 'pending').length;
  const processingCount = repairs.filter(r => r.status === 'in_progress').length;
  const doneCount = repairs.filter(r => r.status === 'completed').length;

  return (
    `สรุปงานวันนี้ ${dateStr} เวลา ${timeStr}\n` +
    `อาคาร: ${buildingName}\n\n` +
    `รอดำเนินการวันนี้: ${waitingCount}\n` +
    `อยู่ระหว่างดำเนินการวันนี้: ${processingCount}\n` +
    `เสร็จสิ้นวันนี้: ${doneCount}` + '\n' +
    `ยอดงานคงเหลือสะสม: ${accumulated.total} งาน\n` +
    `  - รอดำเนินการ: ${accumulated.pending}\n` +
    `  - อยู่ระหว่างดำเนินการ: ${accumulated.inProgress}`
  );
}

// ✅ ดึง building ทั้งหมดที่มี groupId
async function getAllBuildings() {
  const buildings = await prisma.building.findMany({
    where: {
      groupId: {
        not: null
      }
    }
  });
  return buildings;
}

// ✅ ฟังก์ชันส่งแจ้งเตือนตาม buildingId
async function notifyByBuildingId(building) {
  const today = moment().tz('Asia/Bangkok');
  const startDate = today.startOf('day').toDate();
  const endDate = today.endOf('day').toDate();

  const repairs = await prisma.repair.findMany({
    where: {
      buildingId: building.id,
      createDate: {
        gte: startDate,
        lte: endDate
      },
      isDraft: false
    }
  });

  const accumulated = await getAccumulatedPendingAndInProgress(building.id);
  const buildingName = building.buildingName || `Building ${building.id}`;
  const messageText = createSummaryByStatusMessage(repairs, buildingName, accumulated);

  try {
    await sendLineNotify(building.groupId, {
      type: 'text',
      text: messageText
    });

    console.log(`✅ ส่งสรุปงานให้ ${buildingName} สำเร็จ`);
  } catch (error) {
    console.error(`❌ ส่งสรุปงานให้ ${buildingName} ล้มเหลว:`, error.response?.data || error.message);
  }
}

// ✅ ดึงยอดค้างสะสมของแต่ละสถานะ ทั้งหมดของ buildingId
// ✅ ดึงยอดงานค้างสะสม (pending, in_progress) ทั้งหมดของ buildingId
// async function getAccumulatedPendingAndInProgress(buildingId) {
//   const repairs = await prisma.repair.findMany({
//     where: {
//       buildingId: buildingId,
//       status: {
//         in: ['pending', 'in_progress']
//       },
//       isDraft: false
//     }
//   });
//   return repairs.length;
// }

// ✅ ดึงยอดงานคงเหลือสะสม แยกตามสถานะ
async function getAccumulatedPendingAndInProgress(buildingId) {
  const pendingCount = await prisma.repair.count({
    where: {
      buildingId: buildingId,
      status: 'pending',
      isDraft: false
    }
  });

  const inProgressCount = await prisma.repair.count({
    where: {
      buildingId: buildingId,
      status: 'in_progress',
      isDraft: false
    }
  });

  return {
    pending: pendingCount,
    inProgress: inProgressCount,
    total: pendingCount + inProgressCount
  };
}


// ✅ ตั้ง Cronjob เวลาไทย (ตัวอย่าง 19:00 ทุกวัน)
cron.schedule('00 19 * * *', async () => {
  console.log('⏰ เริ่มส่งสรุปงานซ่อมรายวัน (เวลาไทย)');

  const buildings = await getAllBuildings();
  console.log(`พบอาคารที่ต้องส่ง: ${buildings.length} ตึก`);

  for (const building of buildings) {
    await notifyByBuildingId(building);
  }

  console.log('✅ ส่งสรุปงานครบทุกตึกแล้ว');
}, {
  timezone: 'Asia/Bangkok'
});
