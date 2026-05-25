document.addEventListener('DOMContentLoaded', () => {

  // --- STATE VARIABLES ---
  let selectedPaymentMethod = 'full'; // 'full' or 'split'
  let pageMode = 'demo'; // defaults to sandbox/demo for simulated payment checkout flow
  let userPhone = '';
  let calculatedAmount = 4997000;
  let calculatedSyntax = 'TAT';
  
  // --- DOM ELEMENTS ---
  const priceDisplay = document.getElementById('price-display');
  const priceUnit = document.getElementById('price-unit');
  const priceBreakdown = document.getElementById('price-breakdown');
  const priceAnchoring = document.getElementById('price-anchoring');
  
  const payFullRadio = document.getElementById('pay-full');
  const paySplitRadio = document.getElementById('pay-split');
  
  const regForm = document.getElementById('reg-form');
  const stepFormContainer = document.getElementById('step-form-container');
  const stepPaymentContainer = document.getElementById('step-payment-container');
  const stepSuccessContainer = document.getElementById('step-success-container');
  
  const paymentQrImg = document.getElementById('payment-qr-img');
  const fallbackAmount = document.getElementById('fallback-amount');
  const fallbackSyntax = document.getElementById('fallback-syntax');
  const paymentProgressBar = document.getElementById('payment-progress-bar');
  const paymentProgressBarContainer = document.querySelector('.progress-bar-container');
  const paymentStatusText = document.getElementById('payment-status-text');
  
  const btnPaid = document.getElementById('btn-paid');
  const btnCopyAmount = document.getElementById('btn-copy-amount');
  const btnCopySyntax = document.getElementById('btn-copy-syntax');
  
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

  // --- FAQ ACCORDION ---
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(q => {
    q.addEventListener('click', () => {
      const parent = q.parentElement;
      const answer = parent.querySelector('.faq-answer');
      const isOpen = parent.classList.contains('open');
      
      // Close all first
      document.querySelectorAll('.faq-item').forEach(item => {
        const ans = item.querySelector('.faq-answer');
        if (ans) ans.style.maxHeight = '0';
        item.classList.remove('open');
      });
      
      // Open clicked item with calculated height
      if (!isOpen) {
        parent.classList.add('open');
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
      if (finalCtaSection) {
        finalCtaSection.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Autofocus sau khi cuộn xong
      setTimeout(() => {
        if (userNameInput) userNameInput.focus();
      }, 800);
    });
  });

  // --- STICKY FOOTER BAR LOGIC ---
  // Chỉ hiển thị sticky CTA khi scroll qua 50% trang
  if (stickyBar) {
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 50) {
        stickyBar.classList.add('show');
      } else {
        stickyBar.classList.remove('show');
      }
    });
  }

  // --- COPY TO CLIPBOARD INLINE FEEDBACK ---
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      const originalText = btn.textContent;
      navigator.clipboard.writeText(textToCopy).then(() => {
        btn.textContent = 'Đã copy!';
        btn.style.backgroundColor = 'var(--green-600)';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.backgroundColor = '';
        }, 2000);
      }).catch(err => {
        console.error('Lỗi khi copy: ', err);
      });
    });
  });

  // Mouse move tracker for 3D card glows
  document.querySelectorAll('.persona-card, .testimonial-card, .included-item, .day-card, .learn-card, .timeline-card').forEach(card => {
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
    if (!priceDisplay) return;
    
    const fullOptionCard = document.querySelector('#pay-full ~ .option-card');
    const splitOptionCard = document.querySelector('#pay-split ~ .option-card');
    
    if (selectedPaymentMethod === 'full') {
      priceDisplay.textContent = '4.997.000đ';
      if (priceUnit) priceUnit.textContent = '/trọn gói';
      if (priceBreakdown) priceBreakdown.textContent = 'Chỉ khoảng ~2.500.000đ/ngày hoặc ~208.000đ/giờ học chuyên sâu.';
      if (priceAnchoring) priceAnchoring.textContent = 'Rẻ hơn 4 lần so với việc thuê chuyên gia tư vấn giáo trình riêng lẻ.';
      
      if (fullOptionCard) {
        fullOptionCard.style.borderColor = 'var(--purple-700)';
        fullOptionCard.style.backgroundColor = 'var(--purple-50)';
        const fullTitle = fullOptionCard.querySelector('h4');
        if (fullTitle) fullTitle.style.color = 'var(--purple-700)';
        const fullPrice = fullOptionCard.querySelector('.price');
        if (fullPrice) fullPrice.style.color = 'var(--purple-700)';
      }
      if (splitOptionCard) {
        splitOptionCard.style.borderColor = 'var(--gray-200)';
        splitOptionCard.style.backgroundColor = 'var(--white)';
        const splitTitle = splitOptionCard.querySelector('h4');
        if (splitTitle) splitTitle.style.color = 'var(--gray-700)';
        const splitPrice = splitOptionCard.querySelector('.price');
        if (splitPrice) splitPrice.style.color = 'var(--gray-900)';
      }
    } else {
      priceDisplay.textContent = '2.500.000đ';
      if (priceUnit) priceUnit.textContent = '/kỳ 1';
      if (priceBreakdown) priceBreakdown.textContent = 'Thanh toán kỳ 2 (2.500.000đ) sau khi hoàn thành Ngày 1.';
      if (priceAnchoring) priceAnchoring.textContent = 'Giúp tháo gỡ áp lực tài chính, sở hữu ngay suất học.';
      
      if (fullOptionCard) {
        fullOptionCard.style.borderColor = 'var(--gray-200)';
        fullOptionCard.style.backgroundColor = 'var(--white)';
        const fullTitle = fullOptionCard.querySelector('h4');
        if (fullTitle) fullTitle.style.color = 'var(--gray-700)';
        const fullPrice = fullOptionCard.querySelector('.price');
        if (fullPrice) fullPrice.style.color = 'var(--gray-900)';
      }
      if (splitOptionCard) {
        splitOptionCard.style.borderColor = 'var(--purple-700)';
        splitOptionCard.style.backgroundColor = 'var(--purple-50)';
        const splitTitle = splitOptionCard.querySelector('h4');
        if (splitTitle) splitTitle.style.color = 'var(--purple-700)';
        const splitPrice = splitOptionCard.querySelector('.price');
        if (splitPrice) splitPrice.style.color = 'var(--purple-700)';
      }
    }
  }
  
  // Call initial pricing card update
  updatePricingCard();
  
  if (payFullRadio) {
    payFullRadio.addEventListener('change', () => {
      selectedPaymentMethod = 'full';
      updatePricingCard();
    });
  }
  
  if (paySplitRadio) {
    paySplitRadio.addEventListener('change', () => {
      selectedPaymentMethod = 'split';
      updatePricingCard();
    });
  }

  // --- FORM SUBMIT & PAYMENT STATE ENGINE ---
  if (regForm) {
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
        shakeInput(nameInput);
        isValid = false;
      }
      
      // Validate Phone
      const phoneVal = phoneInput.value.trim();
      if (!validatePhone(phoneVal)) {
        phoneInput.parentElement.classList.add('has-error');
        errorPhone.textContent = 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số, bắt đầu bằng 0).';
        errorPhone.style.display = 'block';
        shakeInput(phoneInput);
        isValid = false;
      }
      
      // Validate Email
      const emailVal = emailInput.value.trim();
      if (!validateEmail(emailVal)) {
        emailInput.parentElement.classList.add('has-error');
        errorEmail.textContent = 'Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@domain.com).';
        errorEmail.style.display = 'block';
        shakeInput(emailInput);
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
      calculatedAmount = basePrice;
      
      // Calculate syntax
      calculatedSyntax = `TAT ${userPhone}`;
      
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
        paymentInstructions.innerHTML = `Quét mã QR dưới đây bằng ứng dụng Ngân hàng của bạn để hoàn tất thanh toán Trọn gói (<strong>${formattedAmount}</strong>).`;
      } else {
        paymentInstructions.innerHTML = `Quét mã QR dưới đây bằng ứng dụng Ngân hàng của bạn để hoàn tất thanh toán Kỳ 1 (<strong>${formattedAmount}</strong>). Kỳ 2 (2.500.000đ) sẽ thanh toán sau khi hoàn thành Ngày 1.`;
      }

      setTimeout(() => {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;

        // Transition Step: Form -> Payment Pending
        stepFormContainer.classList.remove('active');
        stepPaymentContainer.classList.add('active');
        
        // Setup state according to Mode (Sandbox vs Production)
        if (pageMode === 'demo') {
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
          paymentProgressBarContainer.style.display = 'none';
          paymentStatusText.textContent = 'Đang đợi giao dịch chuyển khoản thực tế của bạn...';
          paymentStatusText.style.color = '#FF7733';
        }
      }, 1000); // 1-second dynamic load simulation
    });
  }

  // --- PAID BUTTON (CONFIRM PAYMENT) ---
  if (btnPaid) {
    btnPaid.addEventListener('click', () => {
      // Show Loading state on Paid button
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
        
        // Trigger success checkmark animation
        triggerSuccessAnimation();
      }, 1500); // 1.5-second loading verification simulation
    });
  }

  // --- OTO VIP COACHING UPSELL LOGIC ---
  if (btnAcceptOto) {
    btnAcceptOto.addEventListener('click', () => {
      otoPaymentDetails.style.display = 'block';
      btnAcceptOto.style.display = 'none';
    });
  }

  // --- SUCCESS CHECKMARK ANIMATION ---
  function triggerSuccessAnimation() {
    const successIcon = document.querySelector('.success-icon');
    if (successIcon) {
      successIcon.classList.add('animate-success');
    }
  }

  // --- COUNTDOWN TIMER ---
  function initCountdown() {
    const countdownEl = document.querySelector('.badge-timer .countdown');
    if (!countdownEl) return;

    let targetTime = localStorage.getItem('tat_countdown_target');
    if (!targetTime) {
      // 23h 45m from now
      const now = new Date().getTime();
      targetTime = now + (23 * 60 * 60 * 1000) + (45 * 60 * 1000);
      localStorage.setItem('tat_countdown_target', targetTime);
    } else {
      targetTime = parseInt(targetTime, 10);
      // If target time has already passed, reset it to another 24h to keep it working
      if (targetTime < new Date().getTime()) {
        const now = new Date().getTime();
        targetTime = now + (23 * 60 * 60 * 1000) + (45 * 60 * 1000);
        localStorage.setItem('tat_countdown_target', targetTime);
      }
    }

    function update() {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance < 0) {
        countdownEl.textContent = "Đã đóng đăng ký";
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownEl.textContent = `${hours}h ${minutes}p ${seconds}s`;
    }

    update();
    setInterval(update, 1000);
  }
  initCountdown();

  // --- SCROLL REVEAL ANIMATION ---
  function initScrollReveal() {
    const revealElements = document.querySelectorAll(
      '.persona-card, .timeline-card, .learn-card, .day-card, .included-item, .testimonial-card'
    );
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
      el.classList.add('reveal-element');
      observer.observe(el);
    });
  }
  initScrollReveal();

  // --- HELPERS & ANIMATIONS ---
  function shakeInput(inputEl) {
    inputEl.classList.add('shake-input');
    inputEl.addEventListener('animationend', () => {
      inputEl.classList.remove('shake-input');
    }, { once: true });
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function validatePhone(phone) {
    const re = /^0[0-9]{9}$/;
    return re.test(phone);
  }

});
