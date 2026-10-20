import type { AppElements, FileUploadState } from './app/types.js';
import { initPlayerBar } from './features/automation/player-bar/index.js';
import { initSubmit } from './features/automation/submit.js';
import { initHoursHint } from './features/instructors/index.js';
import { initNotificationConsent } from './features/notifications/index.js';
import { initMonthsShowcase } from './features/scheduling/index.js';
import { initDropzoneSpotlight, initFileHandling } from './features/spreadsheet/index.js';
import { initDynamicBackground } from './features/theme/index.js';
import { initPreviewModal } from './shell/preview-modal.js';
import { initTitleBar } from './shell/title-bar.js';

function getElements(): AppElements {
  return {
    dropzone: document.getElementById('dropzone') as HTMLElement,
    fileInput: document.getElementById('fileInput') as HTMLInputElement,
    dropzoneText: document.getElementById('dropzoneText') as HTMLElement,
    excelPreview: document.getElementById('excelPreview') as HTMLElement,
    previewOpenButton: document.getElementById('previewOpenButton') as HTMLButtonElement,
    previewModal: document.getElementById('previewModal') as HTMLElement,
    previewBackdrop: document.getElementById('previewBackdrop') as HTMLElement,
    previewCloseButton: document.getElementById('previewCloseButton') as HTMLButtonElement,
    playerTableButton: document.getElementById('playerTableButton') as HTMLButtonElement,
    playerLocateButton: document.getElementById('playerLocateButton') as HTMLButtonElement,
    cardsGrid: document.getElementById('cardsGrid') as HTMLElement,
    programFilter: document.getElementById('programFilter') as HTMLElement,
    hoursFilter: document.getElementById('hoursFilter') as HTMLElement,
    cardsSearch: document.getElementById('cardsSearch') as HTMLInputElement,
    cardsSelectAll: document.getElementById('cardsSelectAll') as HTMLInputElement,
    cardsCount: document.getElementById('cardsCount') as HTMLElement,
    cardsEmpty: document.getElementById('cardsEmpty') as HTMLElement,
    playButton: document.getElementById('playerPlay') as HTMLButtonElement | null,
    playerIdentification: document.getElementById('playerIdentification') as HTMLElement,
    playerInstructorName: document.getElementById('playerInstructorName') as HTMLElement,
    playerProgressCurrent: document.getElementById('playerProgressCurrent') as HTMLElement,
    playerProgressTotal: document.getElementById('playerProgressTotal') as HTMLElement,
    playerTrack: document.getElementById('playerTrack') as HTMLElement,
    playerProgressFill: document.getElementById('playerProgressFill') as HTMLElement,
    playerHoursHint: document.getElementById('playerHoursHint') as HTMLElement,
    statusMessage: document.getElementById('statusMessage') as HTMLElement,
    inputUser: document.getElementById('usuario') as HTMLInputElement,
    inputPass: document.getElementById('password') as HTMLInputElement,
    inputStartDate: document.getElementById('fechaInicio') as HTMLInputElement,
    inputEndDate: document.getElementById('fechaFin') as HTMLInputElement,
  };
}

function initIconScrollAnimations(): void {
  // Los iconos que ya nacen con `is-visible` los anima el CSS. Solo se prepara
  // un observador para los que se añadan sin esa clase.
  const pending = Array.from(document.querySelectorAll<HTMLElement>('.app-icon:not(.is-visible)'));
  if (!pending.length) return;

  document.documentElement.classList.add('icons-ready');
  pending.forEach((icon, index) => {
    if (!icon.style.getPropertyValue('--icon-delay')) {
      icon.style.setProperty('--icon-delay', `${Math.min(index * 45, 300)}ms`);
    }
  });

  if (!('IntersectionObserver' in window)) {
    pending.forEach((icon) => icon.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  pending.forEach((icon) => observer.observe(icon));

  // Red de seguridad: ningún icono debe quedarse invisible si el observador no
  // llega a dispararse (por ejemplo, si la vista cambia antes de pintarse).
  window.setTimeout(() => {
    pending.forEach((icon) => icon.classList.add('is-visible'));
    observer.disconnect();
  }, 4000);
}

function initApp(): void {
  const elements = getElements();
  const state: FileUploadState = { file: null };

  initDynamicBackground();
  initTitleBar();
  initNotificationConsent();
  initMonthsShowcase();
  initPlayerBar(elements);
  initHoursHint(elements);
  initDropzoneSpotlight(elements.dropzone);
  initFileHandling(elements, state);
  initPreviewModal(elements);
  initSubmit(elements, state);
  initIconScrollAnimations();
}

document.addEventListener('DOMContentLoaded', initApp);
