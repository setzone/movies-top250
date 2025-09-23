const BRANCH_NAME = "main";
const OWNER_NAME = "fantribe";
const DATA_SOURCES = [
  "https://cdn.jsdmirror.com/gh/{owner}/{repo}@{branch}/{file}",
  "https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{file}",
  "https://raw.githubusercontent.com/{owner}/{repo}/refs/heads/{branch}/{file}",
];

function formatStr(template, params) {
  return template.replace(/{(\w+)}/g, (match, key) => params[key] || "");
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Check if a date is valid (not in the future)
function isValidDate(date) {
  const today = new Date();
  return date <= today;
}

function getValue(val) {
  if (val === null || val == undefined) {
    return "";
  } else if (Array.isArray(val)) {
    return val.length > 0 ? val[0] : "";
  } else if (val.constructor == Object) {
    return val.value;
  } else {
    return String(val);
  }
}

function getValue2(val) {
  const result = getValue(val);
  if (result === "0") {
    return "-";
  }
  return result;
}

function isNotNull(item) {
  // 忽略 null、undefined 和空字符串、空数组
  if (item === null || item === undefined || item === "") {
    return false;
  }
  if (Array.isArray(item) && item.length === 0) {
    return false;
  }
  return true;
}

function mergeValues(...args) {
  const sep = "<br>";
  const listItems = args
    .filter((item) => {
      return isNotNull(item);
    })
    .map((item) => {
      // 如果是数组，将其内容拼接成字符串
      if (Array.isArray(item)) {
        // return item.map((val) => `<li>${val}</li>`).join("");
        return `<li>${item.join(' / ')}</li>`;
      } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        return `<li>${Object.values(item).join('/')}</li>`;
      }
      return `<li>${item}</li>`;
    })
    .join("");
  return listItems; // `<ul>${listItems}</ul>`;
}

function extractVal(val, isYear) {
  if (Array.isArray(val) && val.length == 2) {
    const items = val[1].split(" / ");
    if (isYear) {
      return !isNaN(Number(items[0].substring(0, 4), 10)) ? items[0].substring(0, 4) : "0";
    } else {
      return items.length >= 2 ? items[1] : "";
    }
  }
  return "";
}

function nvl(...args) {
  for (let val of args) {
    if (isNotNull(val)) {
      return val;
    }
  }
  return "";
}

function getRank(rank) {
  if (isNotNull(rank)) {
    return "-";
  }
  if (!isNaN(Number(rank), 10)) {
    return Number(rank, 10);
  }
  return "-";
}

function sortByKey(array, key) {
  return array.sort((a, b) => {
    const numA = Number(a[key]);
    const numB = Number(b[key]);

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    // Otherwise, compare as strings
    return String(valA).localeCompare(String(valB));
  });
}

// Show/hide loading indicator
function setLoading(isLoading) {
  const loadingIndicator = document.getElementById("loadingIndicator");
  const dataDiv = document.getElementById("dataInfo");
  const table = document.getElementById("dataTable");
  loadingIndicator.style.display = isLoading ? "block" : "none";
  dataDiv.style.display = !isLoading ? "block" : "none";
  table.style.display = !isLoading ? "block" : "none";
  if (isLoading) {
    dataDiv.innerHTML = "";
    table.innerHTML = "";
  }
}

// Add this function to toggle poster column visibility
function togglePosterVisibility() {
  const showPostersCheckbox = document.getElementById("showPosters");
  const table = document.getElementById("dataTable");
  const posterColumnIndex = 1; // Second column (index 1) is the poster column

  if (table) {
    // Select all rows (header and body)
    const rows = table.querySelectorAll("tr");

    rows.forEach((row) => {
      const posterCell = row.cells[posterColumnIndex];
      if (posterCell) {
        posterCell.style.display = showPostersCheckbox.checked ? "" : "none";
      }
    });
  }
}

// Add event listener for the showPosters checkbox
document.addEventListener("DOMContentLoaded", () => {
  const showPostersCheckbox = document.getElementById("showPosters");
  if (showPostersCheckbox) {
    showPostersCheckbox.addEventListener("change", togglePosterVisibility);
  }
});

// Render table with movie data
function renderTable(data) {
  const table = document.getElementById("dataTable");
  table.style.display = "block";
  table.innerHTML = "";

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);

  const columns = ["序号", "海报", "排名", "电影", "评分", "年份", "国别/地区", "更多信息"];
  const thRow = document.createElement("tr");
  columns.forEach((col, index) => {
    const td = document.createElement("td");
    td.textContent = col;
    thRow.appendChild(td);
  });
  thead.appendChild(thRow);

  tbody.innerHTML = "";

  const sortedData = sortByKey(data, "rank");
  sortedData.forEach((movie, index) => {
    const row = document.createElement("tr");
    const title = nvl(movie.name, movie.title);
    const rank = getRank(movie.rank);
    const year = nvl(getValue(movie.year), extractVal(movie.abstract, true));
    const region = nvl(getValue(movie.region), extractVal(movie.abstract, false));
    const cover = nvl(getValue(movie.covers), movie.pic ? movie.pic.normal : "");
    const rating = nvl(getValue2(movie.score), getValue2(movie.rating), "-");
    const link = nvl(getValue(movie.links), movie.url);
    const info = nvl(mergeValues(
      movie.type_name,
      movie.publish,
      movie.region,
      nvl(movie.genre, movie.genres),
      movie.director,
      movie.actors,
      movie.abstract,
      movie.certificate,
      movie.info,
      movie.quote
    ), '<li>' + getValue(movie.summary) + '</li>');

    row.innerHTML = `
              <td>${index + 1}</td>
              <td><img alt="${title}" src="${cover}" loading="lazy" /></td>
              <td>${rank}</td>
              <td><a href="${link}">${title}</a></td>
              <td>${rating}</td>
              <td>${year}</td>
              <td>${region}</td>
              <td><ul>${info}</ul></td>
          `;
    tbody.appendChild(row);
  });

  // After rendering the table, check the checkbox state
  const showPostersCheckbox = document.getElementById("showPosters");
  if (showPostersCheckbox) {
    togglePosterVisibility();
  }
}

function adjustDate(currentDate, minDate, operation) {
  if (!(currentDate instanceof Date) || !(minDate instanceof Date)) {
    throw new Error("Both currentDate and minDate must be valid Date objects.");
  }

  // 获取今天的日期
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // 确保只比较日期部分，忽略时间

  // 克隆当前日期以避免修改原始对象
  let adjustedDate = new Date(currentDate);
  adjustedDate.setUTCHours(0, 0, 0, 0); // 忽略时间部分

  // 根据操作类型调整日期
  if (operation === "+") {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    if (adjustedDate > today) {
      adjustedDate = today; // 如果超过今天，则设置为今天
    }
  } else if (operation === "-") {
    // 减少一天，但不小于指定日期
    adjustedDate.setDate(adjustedDate.getDate() - 1);
    if (adjustedDate < minDate) {
      adjustedDate = minDate; // 如果小于最小日期，则设置为最小日期
    }
  } else {
    throw new Error("Invalid operation. Use 'add' or 'subtract'.");
  }

  return adjustedDate;
}

function process(repo, filePath, limitDate) {
  const datePicker = document.getElementById("datePicker");
  const prevDateBtn = document.getElementById("prevDate");
  const nextDateBtn = document.getElementById("nextDate");

  // Update UI with current date and button states
  function updateDateDisplay(currentDate, minDate) {
    const formattedDate = formatDate(currentDate);
    datePicker.value = formattedDate;

    // Set min/max date for date picker
    const maxDate = new Date();
    maxDate.setUTCHours(0, 0, 0, 0);
    datePicker.min = formatDate(minDate);
    datePicker.max = formatDate(maxDate);

    // Update button state
    prevDateBtn.disabled = currentDate <= minDate;
    prevDateBtn.style.opacity = nextDateBtn.disabled ? "0.5" : "1";
    nextDateBtn.disabled = currentDate >= maxDate;
    nextDateBtn.style.opacity = nextDateBtn.disabled ? "0.5" : "1";
  }

  const minDate = (limitDate === null || limitDate == undefined) ? new Date() : new Date(limitDate);
  let currentSourceIndex = 0;
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 1); // 初始为昨天
  if (currentDate < minDate) {
    currentDate = minDate;
  }
  currentDate.setUTCHours(0, 0, 0, 0);

  // Fetch data from the next available source
  async function fetchDataWithFallback(date, repo, filePath) {
    const errors = [];
    const day = formatDate(date).replace(/-/g, "");
    const month = day.substring(0, 6);
    const fullPath = formatStr(filePath, { month: month, day: day });

    for (let i = 0; i < DATA_SOURCES.length; i++) {
      const sourceIndex = (currentSourceIndex + i) % DATA_SOURCES.length;
      const baseUrl = DATA_SOURCES[sourceIndex];
      const url = formatStr(baseUrl, {
        owner: OWNER_NAME,
        repo: repo,
        branch: BRANCH_NAME,
        file: fullPath,
      });

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        currentSourceIndex = sourceIndex; // Remember successful source
        return data;
      } catch (error) {
        errors.push(`Source ${sourceIndex + 1}: ${error.message}`);
        continue;
      }
    }

    throw new Error(`All data sources failed:\n${errors.join("\n")}`);
  }

  // Load data for the current date
  async function loadData(date, repo, filePath) {
    try {
      setLoading(true);
      const data = await fetchDataWithFallback(date, repo, filePath);

      const movies = data["movies"];
      const subtitle = data["description"]["subtitle"];
      const updateTime = data["extra"]["modify_time"]
        ? data["extra"]["modify_time"]
        : data["update_time"];
      const updateInfo = `<i>最新更新: ${updateTime}<i>`;
      const quote = document.createElement("blockquote");
      quote.innerHTML = subtitle ? `${subtitle}<br><br>${updateInfo}` : updateInfo;
      const dataDiv = document.getElementById("dataInfo");
      dataDiv.innerHTML = "";
      dataDiv.appendChild(quote);

      renderTable(movies);
    } catch (error) {
      console.error("Error loading data:", error);
      const dataDiv = document.getElementById("dataInfo");
      dataDiv.innerHTML = `<blockquote class=\"top250-quote\"">数据请求失败，请尝试其他日期</blockquote>`;
    } finally {
      setLoading(false);
    }
  }

  // Event Handlers
  prevDateBtn.addEventListener("click", () => {
    currentDate = adjustDate(currentDate, minDate, "-");
    updateDateDisplay(currentDate, minDate);
    loadData(currentDate, repo, filePath);
  });

  nextDateBtn.addEventListener("click", () => {
    const nextDate = adjustDate(currentDate, minDate, "+");
    if (isValidDate(nextDate)) {
      currentDate = nextDate;
      updateDateDisplay(currentDate, minDate);
      loadData(currentDate, repo, filePath);
    }
  });

  datePicker.addEventListener("change", (e) => {
    const selectedDate = new Date(e.target.value);
    if (isValidDate(selectedDate)) {
      currentDate = selectedDate;
      updateDateDisplay(currentDate, minDate);
      loadData(currentDate, repo, filePath);
    } else {
      // Reset to current date if invalid date selected
      currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - 1); // 初始为昨天
      if (currentDate < minDate) {
        currentDate = minDate;
      }
      currentDate.setUTCHours(0, 0, 0, 0);
      loadData(currentDate, repo, filePath);
    }
  });

  // Initialize
  updateDateDisplay(currentDate, minDate);
  loadData(currentDate, repo, filePath);
}

// Default configuration
const DEFAULT_CONFIG = {
  repo: "cinephile-douban",
  filePath: "data-top/{month}/movie-top250-{day}.json",
  minDate: "2025-05-01"
};

class MovieRankingApp {
  constructor(config = {}) {
    // Merge with default config
    this.repoConfig = { ...DEFAULT_CONFIG, ...config };
    console.log("config", this.repoConfig);
    this.initialize();
  }

  initialize() {
    try {
      // Clear existing content
      const tableContainer = document.getElementById('table-container');
      if (tableContainer) {
        tableContainer.innerHTML = `
          <div id="loadingIndicator" class="loading">正在加载数据...</div>
          <div id="dataInfo"></div>
          <table id="dataTable"></table>
        `;
      }

      // Initialize with new config
      process(this.repoConfig.repo, this.repoConfig.filePath, this.repoConfig.minDate);
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }
}

// Initialize the application when the DOM is fully loaded
if (window.REPO_INFO) {
  window.app = new MovieRankingApp(window.REPO_INFO);
}

export { MovieRankingApp };
