// 停用瀏覽器預設的捲動記憶，強制每次整理後置頂
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// 備援複製方法
function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    alert('銀行帳號已複製到剪貼簿！');
  } catch (err) {
    alert('複製失敗，請手動選取複製');
  }
  document.body.removeChild(textArea);
}

// 複製匯款帳號
function copyBank() {
  const bankElement = document.getElementById('bankNumber');
  const number = bankElement ? bankElement.innerText.replace(/\s+/g, '') : "777206111617";

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(number)
      .then(() => {
        alert("銀行帳號已複製（無空格）：" + number);
      })
      .catch(() => {
        fallbackCopy(number);
      });
  } else {
    fallbackCopy(number);
  }
}

// 匯款後五碼只允許輸入 5 位數字
const last5Input = document.getElementById("last5");
if (last5Input) {
  last5Input.addEventListener("input", function() {
    this.value = this.value.replace(/\D/g, "").slice(0, 5);
  });
}

// ==========================================
// 課程勾選與總額動態計算
// ==========================================
const eventCheckboxes = document.querySelectorAll('input[name="event_select"]');
const totalAmountDisplay = document.getElementById('totalAmount');
const summaryDisplay = document.getElementById('selectedEventsSummary');
const sessionNameInput = document.getElementById('sessionNameInput');
const sessionFeeInput = document.getElementById('sessionFeeInput');

function calculateTotal() {
  let total = 0;
  let selectedNames = [];

  eventCheckboxes.forEach(cb => {
    if (cb.checked) {
      total += parseInt(cb.getAttribute('data-price'), 10);
      selectedNames.push(cb.value);
    }
  });

  if (selectedNames.length > 0) {
    const formattedTotal = 'NT$ ' + total.toLocaleString();
    totalAmountDisplay.innerText = formattedTotal;
    summaryDisplay.innerText = '已選擇：' + selectedNames.join(' ＋ ');
    
    // 寫入準備給 GAS 的隱藏欄位
    if (sessionNameInput) sessionNameInput.value = selectedNames.join('、');
    if (sessionFeeInput) sessionFeeInput.value = formattedTotal;
  } else {
    totalAmountDisplay.innerText = '請勾選欲參加的課程';
    summaryDisplay.innerText = '尚未選擇課程（至少選一場）';
    if (sessionNameInput) sessionNameInput.value = '';
    if (sessionFeeInput) sessionFeeInput.value = '';
  }
}

eventCheckboxes.forEach(cb => {
  cb.addEventListener('change', calculateTotal);
});

// ==========================================
// 報名表單監聽 (串接 Google Apps Script + LINE 引導)
// ==========================================
const regForm = document.getElementById('registrationForm');
if (regForm) {
  regForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('submitBtn');
    const messageBox = document.getElementById('formMessage');

    // 1. 檢查是否至少勾選了一場活動
    const checkedCount = document.querySelectorAll('input[name="event_select"]:checked').length;
    if (checkedCount === 0) {
      alert('請至少勾選一門想參加的課程！');
      return;
    }

    // 2. 檢查後五碼長度
    if (last5Input && last5Input.value.length !== 5) {
      alert('請輸入完整的匯款帳號後五碼（5 碼數字）');
      last5Input.focus();
      return;
    }

    // 3. 蜜罐欄位防機器人
    if (form.website && form.website.value) {
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = '處理報名中，請稍候...';

    const formData = new FormData(form);
    const params = new URLSearchParams(formData);

    try {
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbwg7tNRiVuH8WTlMz347ZOW5wuPJ36fJeCOXcZql0nEm93q7s4I8qS58U4ylHpvUts/exec';

      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      // 隱藏表單輸入內容，展開成功提示卡片
      form.style.display = 'none';
      if (messageBox) {
        messageBox.style.display = 'block';
        messageBox.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

    } catch (error) {
      alert('報名送出時發生問題，請確認網路連線或直接點擊右下方 LINE 由專人為您保留。');
      submitBtn.disabled = false;
      submitBtn.innerText = '送出報名 →';
    }
  });
}

// ==========================================
// 滾動觸發依序進場動畫
// ==========================================
function checkScrollAnimations() {
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const triggerPoint = windowHeight * 0.9;

  // 卡片依序出現
  const cards = document.querySelectorAll('.card:not(.is-visible)');
  cards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    if (rect.top < triggerPoint) {
      setTimeout(() => {
        card.classList.add('is-visible');
      }, index * 150);
    }
  });

  // 適合對象依序滑入
  const suitableItems = document.querySelectorAll('.suitable li:not(.is-visible)');
  suitableItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < triggerPoint) {
      setTimeout(() => {
        item.classList.add('is-visible');
      }, index * 120);
    }
  });
}

// 監聽滾動與載入時機
window.addEventListener('load', checkScrollAnimations);
document.addEventListener('DOMContentLoaded', checkScrollAnimations);
window.addEventListener('scroll', checkScrollAnimations, { passive: true });
window.addEventListener('resize', checkScrollAnimations, { passive: true });


// 自動複製一份卡片達成無縫滾動（未來加圖只要在 HTML 新增一次即可）
const track = document.getElementById('marqueeTrack');
if (track && track.children.length > 0) {
  track.innerHTML += track.innerHTML;
}