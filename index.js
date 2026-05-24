document.addEventListener('DOMContentLoaded', () => {

  // --- STATE VARIABLES ---
  let selectedPaymentMethod = 'full'; // 'full' or 'split'
  let isOrderBumpSelected = false;
  let pageMode = 'demo'; // 'demo' (sandbox) or 'real' (production)
  let userPhone = '';
  let calculatedAmount = 4997000;
  let calculatedSyntax = 'TAT';
  let exitIntentTriggered = false;
  let formInteracted = false;
  
  // --- DOM ELEMENTS ---
  const priceDisplay = document.getElementById('price-display');
  const priceUnit = document.getElementById('price-unit');
  const priceBreakdown = document.getElementById('price-breakdown');
  const priceAnchoring = document.getElementById('price-anchoring');
  
  const payFullRadio = document.getElementById('pay-full');
  const paySplitRadio = document.getElementById('pay-split');
  
  const modeDemoRadio = document.getElementById('mode-demo');
  const modeRealRadio = document.getElementById('mode-real');
  
  const orderBumpCheckbox = document.getElementById('order-bump-trigger');
  
  const regForm = document.getElementById('reg-form');
  const stepFormContainer = document.getElementById('step-form-container');
  const stepPaymentContainer = document.getElementById('step-payment-container');
  const stepSuccessContainer = document.getElementById('step-success-container');
  
  const paymentQrImg = document.getElementById('payment-qr-img');
  const fallbackAmount = document.getElementById('fallback-amount');
  const fallbackSyntax = document.getElementById('fallback-syntax');
  const demoModeBadge = document.getElementById('demo-mode-badge');
  const paymentProgressBar = document.getElementById('payment-progress-bar');
  const paymentProgressBarContainer = document.querySelector('.progress-bar-container');
  const paymentStatusText = document.getElementById('payment-status-text');
  
  const btnPaid = document.getElementById('btn-paid');
  const btnCopyAmount = document.getElementById('btn-copy-amount');
  const btnCopySyntax = document.getElementById('btn-copy-syntax');
  
  const toast = document.getElementById('toast');
  const exitIntentModal = document.getElementById('exit-intent-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const leadForm = document.getElementById('lead-form');
  
  const stickyBar = document.getElementById('sticky-bar');
  const finalCtaSection = document.getElementById('final-cta');
  
  const btnAcceptOto = document.getElementById('btn-accept-oto');
  const otoPaymentDetails = document.getElementById('oto-payment-details');
  const otoSyntax = document.getElementById('oto-syntax');
  
  // --- SEATS COUNT DYNAMIC DECREASE (Scarcity) ---
  let GLOBAL_SEATS_LEFT = 7; // Single source of truth
  const seatCountElements = document.querySelectorAll('.seat-count');
  const progressFills = document.querySelectorAll('.progress-fill');
  
  function updateAllSeatsDisplay() {
    seatCountElements.forEach(el => el.textContent = GLOBAL_SEATS_LEFT);
    const percentage = ((15 - GLOBAL_SEATS_LEFT) / 15) * 100;
    progressFills.forEach(fill => {
      fill.style.width = `${percentage}%`;
    });
    
    // Update urgency state
    const seatsBoxes = document.querySelectorAll('.seats-remaining-box');
    seatsBoxes.forEach(box => {
      box.classList.remove('low-urgency', 'medium-urgency', 'high-urgency');
      if (GLOBAL_SEATS_LEFT >= 10) {
        box.classList.add('low-urgency');
      } else if (GLOBAL_SEATS_LEFT >= 6) {
        box.classList.add('medium-urgency');
      } else {
        box.classList.add('high-urgency');
      }
    });
  }
  
  // Initial sync
  updateAllSeatsDisplay();
  
  setTimeout(() => {
    GLOBAL_SEATS_LEFT = 6;
    updateAllSeatsDisplay();
  }, 45000); // 45s giảm xuống 6
  
  setTimeout(() => {
    GLOBAL_SEATS_LEFT = 5;
    updateAllSeatsDisplay();
  }, 150000); // 2.5m giảm xuống 5 và giữ nguyên

  // --- CURRICULUM TABS ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // --- FAQ ACCORDION ---
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(q => {
    q.addEventListener('click', () => {
      const parent = q.parentElement;
      const answer = parent.querySelector('.faq-answer');
      const isActive = parent.classList.contains('active');
      
      // Close all first
      document.querySelectorAll('.faq-item').forEach(item => {
        const ans = item.querySelector('.faq-answer');
        if (ans) ans.style.maxHeight = '0';
        item.classList.remove('active');
      });
      
      // Open clicked item with calculated height
      if (!isActive) {
        parent.classList.add('active');
        const scrollHeight = answer.scrollHeight;
        answer.style.maxHeight = scrollHeight + 'px';
      }
    });
  });

  // --- SMOOTH SCROLL & AUTOFOCUS ---
  const allScrollCtas = document.querySelectorAll('a[href="#final-cta"], .sticky-cta-btn');
  const userNameInput = document.getElementById('user-name');
  
  allScrollCtas.forEach(cta => {
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      finalCtaSection.scrollIntoView({ behavior: 'smooth' });
      
      // Autofocus sau khi cuộn xong
      setTimeout(() => {
        userNameInput.focus();
      }, 800);
    });
  });

  // --- STICKY FOOTER BAR LOGIC ---
  // Ẩn/hiện dựa trên vị trí scroll: chỉ hiện khi scroll qua Hero, và tự ẩn khi tới form đăng ký
  const heroSection = document.querySelector('.hero-section');
  
  window.addEventListener('scroll', () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom + window.scrollY;
    const finalCtaTop = finalCtaSection.getBoundingClientRect().top + window.scrollY;
    const currentScroll = window.scrollY + window.innerHeight;
    
    if (window.scrollY > heroBottom - 200 && currentScroll < finalCtaTop + 100) {
      stickyBar.classList.add('show');
    } else {
      stickyBar.classList.remove('show');
    }
  });

  // --- TOAST NOTIFICATION & COPY ---
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }
  
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Đã sao chép vào bộ nhớ tạm!');
      }).catch(err => {
        console.error('Lỗi khi copy: ', err);
      });
    });
  });

  // --- EXIT-INTENT LEAD MAGNET MODAL ---
  // Lắng nghe di chuột ra ngoài trang
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 0) {
      triggerExitIntent();
    }
  });
  
  // Lắng nghe scroll quá 50% độ sâu trang
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (window.scrollY / totalHeight) * 100;
    if (scrollPercent > 50) {
      triggerExitIntent();
    }
  });
  
  // Lắng nghe không hoạt động (idle) trong 30 giây
  let idleTimer;
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      triggerExitIntent();
    }, 30000);
  }
  
  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('keypress', resetIdleTimer);
  resetIdleTimer();
  
  // Track tương tác với form để chặn exit-intent popup
  const formInputs = document.querySelectorAll('#reg-form input');
  formInputs.forEach(input => {
    input.addEventListener('focus', () => {
      formInteracted = true;
    });
    input.addEventListener('input', () => {
      formInteracted = true;
    });
  });
  
  function triggerExitIntent() {
    // Nếu đã hiện, hoặc người dùng đã tương tác với form đăng ký chính, hoặc đang ở gần form đăng ký
    const finalCtaRect = finalCtaSection.getBoundingClientRect();
    const isNearForm = finalCtaRect.top < window.innerHeight && finalCtaRect.bottom > 0;
    
    if (exitIntentTriggered || formInteracted || isNearForm || stepSuccessContainer.classList.contains('active')) {
      return;
    }
    
    exitIntentTriggered = true;
    exitIntentModal.classList.add('active');
  }
  
  modalCloseBtn.addEventListener('click', () => {
    exitIntentModal.classList.remove('active');
  });
  
  exitIntentModal.addEventListener('click', (e) => {
    if (e.target === exitIntentModal) {
      exitIntentModal.classList.remove('active');
    }
  });
  
  // Submit Form Lead magnet (Bait)
  leadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('lead-name');
    const emailInput = document.getElementById('lead-email');
    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    
    const errorLeadName = document.getElementById('error-lead-name');
    const errorLeadEmail = document.getElementById('error-lead-email');
    
    nameInput.parentElement.classList.remove('has-error', 'has-success');
    emailInput.parentElement.classList.remove('has-error', 'has-success');
    errorLeadName.style.display = 'none';
    errorLeadEmail.style.display = 'none';
    
    let isValid = true;
    if (nameVal.length < 2) {
      nameInput.parentElement.classList.add('has-error');
      errorLeadName.textContent = 'Họ và tên của bạn cần có ít nhất 2 ký tự.';
      errorLeadName.style.display = 'block';
      isValid = false;
    } else {
      nameInput.parentElement.classList.add('has-success');
    }
    
    if (!validateEmail(emailVal)) {
      emailInput.parentElement.classList.add('has-error');
      errorLeadEmail.textContent = 'Vui lòng nhập địa chỉ email hợp lệ.';
      errorLeadEmail.style.display = 'block';
      isValid = false;
    } else {
      emailInput.parentElement.classList.add('has-success');
    }
    
    if (!isValid) return;
    
    showToast('🎉 Đăng ký nhận Prompt Kit thành công! Vui lòng kiểm tra email của bạn.');
    setTimeout(() => {
      exitIntentModal.classList.remove('active');
    }, 1500);
  });

  // Inline blur validation for Exit Modal inputs
  document.getElementById('lead-name').addEventListener('blur', () => {
    const input = document.getElementById('lead-name');
    const error = document.getElementById('error-lead-name');
    input.parentElement.classList.remove('has-error', 'has-success');
    error.style.display = 'none';
    if (input.value.trim().length >= 2) {
      input.parentElement.classList.add('has-success');
    } else if (input.value.trim().length > 0) {
      input.parentElement.classList.add('has-error');
      error.textContent = 'Họ và tên của bạn cần có ít nhất 2 ký tự.';
      error.style.display = 'block';
    }
  });

  document.getElementById('lead-email').addEventListener('blur', () => {
    const input = document.getElementById('lead-email');
    const error = document.getElementById('error-lead-email');
    input.parentElement.classList.remove('has-error', 'has-success');
    error.style.display = 'none';
    if (validateEmail(input.value.trim())) {
      input.parentElement.classList.add('has-success');
    } else if (input.value.trim().length > 0) {
      input.parentElement.classList.add('has-error');
      error.textContent = 'Vui lòng nhập địa chỉ email hợp lệ.';
      error.style.display = 'block';
    }
  });

  // Tooltip Click Toggle on Mobile
  const tooltipTrigger = document.getElementById('tooltip-trigger');
  const tooltipBubble = document.getElementById('tooltip-bubble');
  if (tooltipTrigger && tooltipBubble) {
    tooltipTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      tooltipBubble.style.display = (tooltipBubble.style.display === 'block') ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      tooltipBubble.style.display = 'none';
    });
  }

  // Mouse move tracker for 3D card glows
  document.querySelectorAll('.persona-card, .testimonial-card, .deliverable-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --- INTERACTIVE PRICING CARD LOGIC ---
  function updatePricingCard() {
    if (selectedPaymentMethod === 'full') {
      priceDisplay.textContent = '4.997.000đ';
      priceUnit.textContent = '/trọn gói';
      priceBreakdown.textContent = 'Chỉ khoảng ~2.500.000đ/ngày hoặc ~208.000đ/giờ học chuyên sâu.';
      priceAnchoring.textContent = 'Rẻ hơn 4 lần so với việc thuê chuyên gia tư vấn giáo trình riêng lẻ.';
    } else {
      priceDisplay.textContent = '2.500.000đ';
      priceUnit.textContent = '/kỳ 1';
      priceBreakdown.textContent = 'Thanh toán kỳ 2 (2.500.000đ) sau khi hoàn thành Ngày 1.';
      priceAnchoring.textContent = 'Giúp tháo gỡ áp lực tài chính, sở hữu ngay suất học.';
    }
  }
  
  // Call initial pricing card update
  updatePricingCard();
  
  payFullRadio.addEventListener('change', () => {
    selectedPaymentMethod = 'full';
    updatePricingCard();
  });
  
  paySplitRadio.addEventListener('change', () => {
    selectedPaymentMethod = 'split';
    updatePricingCard();
  });

  // --- PAGE MODE TOGGLE (Sandbox vs Real) ---
  modeDemoRadio.addEventListener('change', () => {
    pageMode = 'demo';
  });
  
  modeRealRadio.addEventListener('change', () => {
    pageMode = 'real';
  });

  // --- ORDER BUMP LOGIC ---
  orderBumpCheckbox.addEventListener('change', (e) => {
    isOrderBumpSelected = e.target.checked;
  });

  // --- FORM SUBMIT & PAYMENT STATE ENGINE ---
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('user-name');
    const phoneInput = document.getElementById('user-phone');
    const emailInput = document.getElementById('user-email');
    
    const errorName = document.getElementById('error-name');
    const errorPhone = document.getElementById('error-phone');
    const errorEmail = document.getElementById('error-email');
    
    // Clear errors
    nameInput.parentElement.classList.remove('has-error');
    phoneInput.parentElement.classList.remove('has-error');
    emailInput.parentElement.classList.remove('has-error');
    errorName.style.display = 'none';
    errorPhone.style.display = 'none';
    errorEmail.style.display = 'none';
    
    let isValid = true;
    
    // Validate Name
    const nameVal = nameInput.value.trim();
    if (nameVal.length < 2) {
      nameInput.parentElement.classList.add('has-error');
      errorName.textContent = 'Họ và tên của bạn cần có ít nhất 2 ký tự.';
      errorName.style.display = 'block';
      isValid = false;
    }
    
    // Validate Phone
    const phoneVal = phoneInput.value.trim();
    if (!validatePhone(phoneVal)) {
      phoneInput.parentElement.classList.add('has-error');
      errorPhone.textContent = 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số, bắt đầu bằng 0).';
      errorPhone.style.display = 'block';
      isValid = false;
    }
    
    // Validate Email
    const emailVal = emailInput.value.trim();
    if (!validateEmail(emailVal)) {
      emailInput.parentElement.classList.add('has-error');
      errorEmail.textContent = 'Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@domain.com).';
      errorEmail.style.display = 'block';
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Show Loading state on submit button
    const submitBtn = document.getElementById('cta-step-1');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    // --- CALCULATION OF AMOUNT & SYNTAX ---
    userPhone = phoneVal;
    
    // Calculate pricing amount
    let basePrice = (selectedPaymentMethod === 'full') ? 4997000 : 2500000;
    calculatedAmount = basePrice + (isOrderBumpSelected ? 500000 : 0);
    
    // Calculate syntax
    calculatedSyntax = `TAT ${userPhone}` + (isOrderBumpSelected ? ' BUMP' : '');
    
    // Format Display amount
    const formattedAmount = calculatedAmount.toLocaleString('vi-VN') + 'đ';
    fallbackAmount.textContent = formattedAmount;
    fallbackSyntax.textContent = calculatedSyntax;
    
    // Update Copy Data Attributes
    btnCopyAmount.setAttribute('data-copy', calculatedAmount.toString());
    btnCopySyntax.setAttribute('data-copy', calculatedSyntax);
    
    // Generate VietQR dynamic link
    const vietQrUrl = `https://img.vietqr.io/image/MB-0345678910-compact2.png?amount=${calculatedAmount}&addInfo=${encodeURIComponent(calculatedSyntax)}&accountName=SUNEXT%20GROUP`;
    paymentQrImg.src = vietQrUrl;
    
    // Update Instructions based on package
    const paymentInstructions = document.querySelector('.payment-instructions');
    if (selectedPaymentMethod === 'full') {
      paymentInstructions.innerHTML = `Quét mã QR dưới đây bằng ứng dụng Ngân hàng của bạn để hoàn tất thanh toán Trọn gói (<strong>${formattedAmount}</strong>). Hệ thống sẽ tự động giữ chỗ tạm thời cho bạn.`;
    } else {
      paymentInstructions.innerHTML = `Quét mã QR dưới đây bằng ứng dụng Ngân hàng của bạn để hoàn tất thanh toán Kỳ 1 (<strong>${formattedAmount}</strong>). Kỳ 2 (2.500.000đ) sẽ được thanh toán sau khi hoàn thành Ngày 1. Hệ thống sẽ tự động giữ chỗ tạm thời cho bạn.`;
    }

    setTimeout(() => {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;

      // Transition Step: Form -> Payment Pending
      stepFormContainer.classList.remove('active');
      stepPaymentContainer.classList.add('active');
      
      // Setup state according to Mode (Sandbox vs Production)
      if (pageMode === 'demo') {
        demoModeBadge.style.display = 'inline-block';
        paymentProgressBarContainer.style.display = 'block';
        paymentStatusText.textContent = 'Đang kết nối cổng thanh toán MB Bank...';
        paymentStatusText.style.color = '#F59E0B';
        
        // Simulate progress bar checking transaction
        let progress = 0;
        paymentProgressBar.style.width = '0%';
        const progressInterval = setInterval(() => {
          progress += 2;
          paymentProgressBar.style.width = `${progress}%`;
          
          // Dynamic status labels based on progress percentage
          if (progress <= 25) {
            paymentStatusText.textContent = 'Đang kết nối cổng thanh toán MB Bank...';
          } else if (progress <= 55) {
            paymentStatusText.textContent = 'Đang xác thực thông tin tài khoản...';
          } else if (progress <= 85) {
            paymentStatusText.textContent = 'Đang kiểm tra giao dịch sao kê và đối chiếu cú pháp...';
          } else if (progress <= 99) {
            paymentStatusText.textContent = 'Đang hoàn tất đồng bộ giữ chỗ...';
          }
          
          if (progress >= 100) {
            clearInterval(progressInterval);
            paymentStatusText.textContent = 'Đã xác thực giao dịch thành công!';
            paymentStatusText.style.color = '#22C55E';
          }
        }, 100);
        
      } else {
        demoModeBadge.style.display = 'none';
        paymentProgressBarContainer.style.display = 'none';
        paymentStatusText.textContent = 'Đang đợi giao dịch chuyển khoản thực tế của bạn...';
        paymentStatusText.style.color = '#FF7733';
      }
    }, 1000); // 1-second dynamic load simulation
  });

  // --- PAID BUTTON (CONFIRM PAYMENT) ---
  btnPaid.addEventListener('click', () => {
    // Show Loading state onPaid button
    btnPaid.classList.add('btn-loading');
    btnPaid.disabled = true;

    setTimeout(() => {
      btnPaid.classList.remove('btn-loading');
      btnPaid.disabled = false;

      // Transition to Success State
      stepPaymentContainer.classList.remove('active');
      stepSuccessContainer.classList.add('active');
      
      // Update success screen copy based on Mode
      const successTitle = document.querySelector('#success-confirm-message h3');
      const successDesc = document.querySelector('#success-confirm-message .success-desc');
      
      if (pageMode === 'demo') {
        successTitle.textContent = 'Chào mừng bạn đến với cộng đồng 500+ AI-Native Trainers!';
        successDesc.innerHTML = 'Hành trình đột phá sự nghiệp giảng dạy của bạn chính thức bắt đầu từ đây.<br>Yêu cầu giữ chỗ đã được <strong>xác nhận tự động thành công (Chế độ dùng thử)</strong>.';
      } else {
        successTitle.textContent = 'Yêu cầu đăng ký đã được tiếp nhận thành công!';
        successDesc.innerHTML = 'Sunext đang thực hiện kiểm tra giao dịch chuyển khoản của bạn thủ công.<br><strong>Đặc quyền:</strong> Link Zalo bên dưới đã được kích hoạt để bạn vào nhóm khóa chỗ ngay trong lúc duyệt giao dịch.';
      }
      
      // Update OTO upsell syntax
      otoSyntax.textContent = `TAT ${userPhone} VIP`;
      
      // Trigger celebratory Confetti (Aarron Walter emotional moment)
      triggerCelebrationConfetti();
    }, 1500); // 1.5-second loading verification simulation
  });

  // --- OTO VIP COACHING UPSELL LOGIC ---
  btnAcceptOto.addEventListener('click', () => {
    otoPaymentDetails.style.display = 'block';
    btnAcceptOto.style.display = 'none';
    showToast('Cú pháp chuyển khoản VIP đã được hiển thị!');
  });

  // Confetti script function (Upgraded 3-phase animation)
  function triggerCelebrationConfetti() {
    if (typeof confetti !== 'function') return;
    
    const duration = 4000; // 4 seconds
    const end = Date.now() + duration;
    const colors = ['#FF7733', '#3A1C6A', '#FF5500', '#F3EEF9', '#22C55E'];
    
    // Phase 1: Big burst từ giữa màn hình
    confetti({
      particleCount: 150,
      spread: 180,
      origin: { y: 0.6 },
      colors: colors,
      scalar: 1.2,
      gravity: 1,
      ticks: 300
    });
    
    // Phase 2: Continuous rain from sides
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
        shapes: ['circle', 'square'],
        gravity: 0.8,
        scalar: 0.8
      });
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
        shapes: ['circle', 'square'],
        gravity: 0.8,
        scalar: 0.8
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
    
    // Phase 3: Final big blast (sau 2 giây)
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.7 },
        colors: colors,
        startVelocity: 45,
        scalar: 1.5
      });
    }, 2000);
  }

});
