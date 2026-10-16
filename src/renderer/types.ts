export interface FileUploadState {
  file: File | null;
  firstIdentification: string | null;
  identifications: string[];
  isUploading: boolean;
  currentIdentification: string | null;
}

export interface AppElements {
  dropzone: HTMLElement;
  fileInput: HTMLInputElement;
  dropzoneText: HTMLElement;
  excelPreview: HTMLElement;
  previewOpenButton: HTMLButtonElement;
  previewModal: HTMLElement;
  previewBackdrop: HTMLElement;
  previewCloseButton: HTMLButtonElement;
  playerTableButton: HTMLButtonElement;
  cardsGrid: HTMLElement;
  programFilter: HTMLElement;
  hoursFilter: HTMLElement;
  cardsSearch: HTMLInputElement;
  cardsSelectAll: HTMLInputElement;
  cardsCount: HTMLElement;
  cardsEmpty: HTMLElement;
  playButton: HTMLButtonElement | null;
  playerIdentification: HTMLElement;
  playerInstructorName: HTMLElement;
  playerProgressCurrent: HTMLElement;
  playerProgressTotal: HTMLElement;
  playerTrack: HTMLElement;
  playerProgressFill: HTMLElement;
  statusMessage: HTMLElement;
  inputUser: HTMLInputElement;
  inputPass: HTMLInputElement;
  inputStartDate: HTMLInputElement;
  inputEndDate: HTMLInputElement;
}
