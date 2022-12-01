const path = require("path");
const fs = require("fs");
let dataCache = null;

function loadData() {
  if (!dataCache) {
    const file = path.resolve(__dirname, "./data.json");
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const reports = data.dailyReports;
    dataCache = {};
    reports.forEach((report) => {
      dataCache[report?.updatedDate] = report;
    });
  }
  return dataCache;
}

function getCoronavirusKeyIndex() {
  return Object.keys(loadData());
}

function getCoronavirusByDate(date) {
  const dailyData = loadData()[date] || {};
  if (dailyData.countries) {
    // 按照各国确诊人数排序
    dailyData.countries.sort((a, b) => {
      return b.confirmed - a.confirmed;
    });
  }
  return dailyData;
}
module.exports = {
  getCoronavirusByDate,
  getCoronavirusKeyIndex,
};
