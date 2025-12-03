/**
 * SnapMail Enhancements v7
 * - Timer Warning Colors (green/orange/red)
 * - Control Buttons (New + Help)
 * - Help Documentation Modal
 */

(function() {
  'use strict';

  console.log('[SnapMail] Enhancements v7 loaded');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  function start() {
    injectStyles();
    setInterval(enhance, 500);
    enhance();
  }

  function enhance() {
    updateTimer();
    manageControls();
  }

  // ============== STYLES ==============
  function injectStyles() {
    if (document.getElementById('snapmail-enhance-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'snapmail-enhance-styles';
    style.textContent = `
      /* ===== TIMER WARNING COLORS ===== */
      .timer-badge.timer-normal {
        background-color: rgba(16, 185, 129, 0.1) !important;
        border-color: #10b981 !important;
      }
      .timer-badge.timer-normal span { color: #059669 !important; }
      
      .timer-badge.timer-warning {
        background-color: rgba(245, 158, 11, 0.15) !important;
        border-color: #f59e0b !important;
      }
      .timer-badge.timer-warning span { 
        color: #d97706 !important; 
        font-weight: 700 !important; 
      }
      
      .timer-badge.timer-critical {
        background-color: rgba(239, 68, 68, 0.15) !important;
        border-color: #ef4444 !important;
        animation: timer-pulse 1s infinite !important;
      }
      .timer-badge.timer-critical span { 
        color: #dc2626 !important; 
        font-weight: 700 !important; 
      }
      
      @keyframes timer-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.03); }
      }
      
      /* ===== CONTROL BUTTONS ===== */
      .snapmail-controls {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: row;
        gap: 10px;
      }
      
      .snapmail-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 12px 16px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      
      .snapmail-btn:hover {
        background: #f9fafb;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        transform: translateY(-2px);
      }
      
      .snapmail-btn:active {
        transform: translateY(0);
      }
      
      .snapmail-btn svg { 
        width: 18px; 
        height: 18px;
        flex-shrink: 0;
      }
      
      /* New button - green */
      .snapmail-btn-new {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        color: white;
      }
      .snapmail-btn-new:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
      }
      
      /* Help button - white with green icon */
      .snapmail-btn-help {
        padding: 12px;
      }
      .snapmail-btn-help svg {
        color: #10b981;
      }
      .snapmail-btn-help:hover svg {
        color: #059669;
      }
      
      /* ===== HELP MODAL ===== */
      .snapmail-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: modalFadeIn 0.2s ease;
      }
      
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .snapmail-modal {
        background: #ffffff;
        border-radius: 20px;
        max-width: 500px;
        width: 100%;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        animation: modalSlideUp 0.3s ease;
        display: flex;
        flex-direction: column;
      }
      
      @keyframes modalSlideUp {
        from { opacity: 0; transform: translateY(30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      
      .snapmail-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }
      
      .snapmail-modal-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .snapmail-modal-close {
        background: #f3f4f6;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        color: #6b7280;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .snapmail-modal-close:hover {
        background: #e5e7eb;
        color: #111827;
      }
      
      .snapmail-modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }
      
      .snapmail-section {
        margin-bottom: 24px;
      }
      .snapmail-section:last-child {
        margin-bottom: 0;
      }
      
      .snapmail-section-title {
        font-size: 13px;
        font-weight: 700;
        color: #10b981;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 12px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .snapmail-section p {
        font-size: 14px;
        line-height: 1.6;
        color: #4b5563;
        margin: 0 0 8px 0;
      }
      
      .snapmail-steps {
        list-style: none;
        padding: 0;
        margin: 0;
        counter-reset: step;
      }
      
      .snapmail-steps li {
        position: relative;
        padding: 14px 14px 14px 48px;
        margin-bottom: 10px;
        background: #f9fafb;
        border-radius: 12px;
        font-size: 14px;
        color: #374151;
        line-height: 1.5;
        counter-increment: step;
      }
      
      .snapmail-steps li::before {
        content: counter(step);
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        width: 24px;
        height: 24px;
        background: #10b981;
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .snapmail-steps li strong {
        color: #111827;
      }
      
      .snapmail-tip {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 14px 16px;
        border-radius: 0 12px 12px 0;
        font-size: 14px;
        color: #92400e;
        line-height: 1.5;
      }
      
      .snapmail-tip strong {
        color: #78350f;
      }
      
      .snapmail-features-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .snapmail-feature-item {
        background: #f9fafb;
        padding: 16px;
        border-radius: 12px;
        text-align: center;
      }
      
      .snapmail-feature-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }
      
      .snapmail-feature-label {
        font-size: 13px;
        color: #4b5563;
        font-weight: 600;
      }
      
      /* ===== RESPONSIVE ===== */
      @media (max-width: 640px) {
        .snapmail-controls {
          bottom: 16px;
          right: 16px;
          gap: 8px;
        }
        
        .snapmail-btn {
          padding: 10px 14px;
          font-size: 13px;
          border-radius: 10px;
        }
        
        .snapmail-btn svg {
          width: 16px;
          height: 16px;
        }
        
        .snapmail-btn-help {
          padding: 10px;
        }
        
        .snapmail-modal {
          max-height: 85vh;
          border-radius: 16px;
        }
        
        .snapmail-modal-header {
          padding: 16px 20px;
        }
        
        .snapmail-modal-header h2 {
          font-size: 18px;
        }
        
        .snapmail-modal-body {
          padding: 20px;
        }
        
        .snapmail-features-grid {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .snapmail-feature-item {
          padding: 12px;
        }
        
        .snapmail-feature-icon {
          font-size: 24px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============== TIMER ==============
  function updateTimer() {
    const badge = document.querySelector('[data-testid="timer-badge"]');
    if (!badge) return;
    
    const span = badge.querySelector('span');
    if (!span) return;
    
    const text = span.textContent.trim();
    const match = text.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return;
    
    const totalSec = parseInt(match[1]) * 60 + parseInt(match[2]);
    
    badge.classList.remove('timer-normal', 'timer-warning', 'timer-critical');
    
    if (totalSec <= 60) {
      badge.classList.add('timer-critical');
    } else if (totalSec <= 180) {
      badge.classList.add('timer-warning');
    } else {
      badge.classList.add('timer-normal');
    }
  }

  // ============== CONTROL BUTTONS ==============
  function manageControls() {
    const inboxView = document.querySelector('[data-testid="inbox-view"]');
    const emailView = document.querySelector('[data-testid="email-detail-view"]');
    const existingControls = document.querySelector('.snapmail-controls');
    
    // Show controls only on inbox view (not email detail or landing)
    const shouldShow = inboxView && !emailView;
    
    if (shouldShow && !existingControls) {
      createControls();
    }
    
    if (!shouldShow && existingControls) {
      existingControls.remove();
    }
  }
  
  function createControls() {
    const controls = document.createElement('div');
    controls.className = 'snapmail-controls';
    
    // Help button
    const helpBtn = document.createElement('button');
    helpBtn.className = 'snapmail-btn snapmail-btn-help';
    helpBtn.title = 'How to use SnapMail';
    helpBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    `;
    helpBtn.onclick = showHelpModal;
    
    // New Inbox button
    const newBtn = document.createElement('button');
    newBtn.className = 'snapmail-btn snapmail-btn-new';
    newBtn.title = 'Get a new email address';
    newBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>New</span>
    `;
    newBtn.onclick = function() {
      if (confirm('Get a new email address? Your current inbox will be lost.')) {
        sessionStorage.clear();
        window.location.reload();
      }
    };
    
    controls.appendChild(helpBtn);
    controls.appendChild(newBtn);
    document.body.appendChild(controls);
  }

  // ============== HELP MODAL ==============
  function showHelpModal() {
    if (document.querySelector('.snapmail-modal-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'snapmail-modal-overlay';
    overlay.innerHTML = `
      <div class="snapmail-modal">
        <div class="snapmail-modal-header">
          <h2>📧 How to Use SnapMail</h2>
          <button class="snapmail-modal-close" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="snapmail-modal-body">
          
          <div class="snapmail-section">
            <h3 class="snapmail-section-title">🚀 Quick Start</h3>
            <ol class="snapmail-steps">
              <li>Click <strong>"Generate Email Address"</strong> to create your temporary inbox</li>
              <li>Copy your email address using the <strong>copy button</strong></li>
              <li>Use it anywhere you need an email address</li>
              <li>Incoming emails appear <strong>automatically</strong></li>
            </ol>
          </div>
          
          <div class="snapmail-section">
            <h3 class="snapmail-section-title">⏱️ Timer Guide</h3>
            <p>Your inbox expires after <strong>10 minutes</strong> for your privacy:</p>
            <p>
              🟢 <strong>Green</strong> — Plenty of time remaining<br>
              🟠 <strong>Orange</strong> — Less than 3 minutes left<br>
              🔴 <strong>Red</strong> — Under 1 minute, almost expired!
            </p>
          </div>
          
          <div class="snapmail-section">
            <h3 class="snapmail-section-title">💡 Pro Tip</h3>
            <div class="snapmail-tip">
              <strong>Need more time?</strong> Click the green <strong>"+ New"</strong> button to get a fresh email with a full 10-minute timer.
            </div>
          </div>
          
          <div class="snapmail-section">
            <h3 class="snapmail-section-title">✨ Features</h3>
            <div class="snapmail-features-grid">
              <div class="snapmail-feature-item">
                <div class="snapmail-feature-icon">🔒</div>
                <div class="snapmail-feature-label">100% Anonymous</div>
              </div>
              <div class="snapmail-feature-item">
                <div class="snapmail-feature-icon">⚡</div>
                <div class="snapmail-feature-label">Instant Delivery</div>
              </div>
              <div class="snapmail-feature-item">
                <div class="snapmail-feature-icon">🚫</div>
                <div class="snapmail-feature-label">No Signup</div>
              </div>
              <div class="snapmail-feature-item">
                <div class="snapmail-feature-icon">🗑️</div>
                <div class="snapmail-feature-label">Auto-Delete</div>
              </div>
            </div>
          </div>
          
          <div class="snapmail-section">
            <h3 class="snapmail-section-title">⚠️ Good to Know</h3>
            <p>• All emails are <strong>permanently deleted</strong> when expired</p>
            <p>• Don't use for banking or sensitive accounts</p>
            <p>• Perfect for signups, trials & verification codes</p>
          </div>
          
        </div>
      </div>
    `;
    
    // Close handlers
    const closeModal = () => overlay.remove();
    
    overlay.querySelector('.snapmail-modal-close').onclick = closeModal;
    
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
    
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    document.body.appendChild(overlay);
  }

})();
