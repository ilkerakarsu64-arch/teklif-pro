import { Proposal, AppSettings } from '../types';

/**
 * Invokes the browser's native PDF print engine (window.print)
 * with pixel-perfect @media print CSS matching the exact visual screen design of the proposal.
 */
export const downloadProposalPdf = async (element: HTMLElement | null, filename?: string): Promise<void> => {
  window.print();
};

export const createAndSaveVectorPdf = (proposal: Proposal, settings?: AppSettings) => {
  window.print();
};

export const createProposalPdfDocument = (proposal: Proposal, settings?: AppSettings) => {
  window.print();
};
