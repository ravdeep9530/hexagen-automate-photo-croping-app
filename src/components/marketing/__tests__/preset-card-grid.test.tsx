import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PresetCardGrid } from '../preset-card-grid';
import type { PhotoPreset } from '@/domain/presets';

// Mock preset data for testing
const mockPresets: PhotoPreset[] = [
  {
    id: 'ca-passport-50x70',
    name: 'Canada Passport Photo',
    description: 'Canadian passport photo preset: 50 × 70 mm with neutral expression guidance.',
    country: 'CA',
    documentType: 'passport',
    dimensions: { widthMm: 50, heightMm: 70, widthPx: 591, heightPx: 827, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 10,
      acceptedFormats: ['image/jpeg', 'image/png'],
      minResolution: { width: 591, height: 827 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 31, max: 36 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'CA',
      authority: 'Government of Canada',
      url: 'https://www.canada.ca/passports',
      lastReviewed: '2024-06-01T00:00:00.000Z',
      documentType: 'passport',
    },
    isActive: true,
    tags: ['passport', 'canada', '50x70mm', 'white-background'],
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id: 'us-passport-2x2',
    name: 'United States Passport Photo',
    description: 'US passport photo preset: 2 × 2 inches.',
    country: 'US',
    documentType: 'passport',
    dimensions: { widthMm: 50.8, heightMm: 50.8, widthPx: 600, heightPx: 600, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 10,
      acceptedFormats: ['image/jpeg'],
      minResolution: { width: 600, height: 600 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 25, max: 35 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'US',
      authority: 'U.S. Department of State',
      url: 'https://travel.state.gov/passports',
      lastReviewed: '2024-06-01T00:00:00.000Z',
      documentType: 'passport',
    },
    isActive: true,
    tags: ['passport', 'united-states', '2x2in'],
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id: 'in-passport-35x45',
    name: 'India Passport Photo',
    description: 'Indian passport photo preset.',
    country: 'IN',
    documentType: 'passport',
    dimensions: { widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 2,
      acceptedFormats: ['image/jpeg', 'image/png'],
      minResolution: { width: 413, height: 531 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 25, max: 35 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'IN',
      authority: 'Passport Seva, Government of India',
      url: 'https://passportindia.gov.in/',
      lastReviewed: '2024-06-01T00:00:00.000Z',
      documentType: 'passport',
    },
    isActive: false, // Inactive preset
    tags: ['passport', 'india'],
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
];

describe('PresetCardGrid', () => {
  describe('rendering', () => {
    it('renders all active preset cards', () => {
      render(<PresetCardGrid presets={mockPresets} />);

      // Should show active presets (CA and US), but not the inactive India preset
      expect(screen.getByText('Canada Passport Photo')).toBeInTheDocument();
      expect(screen.getByText('United States Passport Photo')).toBeInTheDocument();
      expect(screen.queryByText('India Passport Photo')).not.toBeInTheDocument();
    });

    it('renders empty message when no presets provided', () => {
      render(<PresetCardGrid presets={[]} />);
      expect(screen.getByText('No presets available.')).toBeInTheDocument();
    });

    it('includes inactive presets when showInactive is true', () => {
      render(<PresetCardGrid presets={mockPresets} showInactive />);

      // Should show all three presets including the inactive India preset
      expect(screen.getByText('Canada Passport Photo')).toBeInTheDocument();
      expect(screen.getByText('United States Passport Photo')).toBeInTheDocument();
      expect(screen.getByText('India Passport Photo')).toBeInTheDocument();
    });

    it('limits the number of presets when limit prop is set', () => {
      render(<PresetCardGrid presets={mockPresets} showInactive limit={2} />);

      // Should only show 2 presets
      const cards = screen.getAllByRole('button', { name: /Use This Preset/i });
      expect(cards).toHaveLength(2);
    });
  });

  describe('preset card content', () => {
    it('displays preset dimensions correctly', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      expect(screen.getByText('50×70mm (591×827px)')).toBeInTheDocument();
    });

    it('displays country badge', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      expect(screen.getByText('CA')).toBeInTheDocument();
    });

    it('displays accepted formats', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      expect(screen.getByText(/JPEG/)).toBeInTheDocument();
      expect(screen.getByText(/PNG/)).toBeInTheDocument();
    });

    it('displays authority information', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      expect(screen.getByText('Government of Canada')).toBeInTheDocument();
    });

    it('displays background color information', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      expect(screen.getByText(/White background/)).toBeInTheDocument();
    });

    it('renders preset tags', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      expect(screen.getByText('passport')).toBeInTheDocument();
      expect(screen.getByText('canada')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onSelectPreset when Use This Preset is clicked', () => {
      const handleSelect = vi.fn();
      render(<PresetCardGrid presets={mockPresets} onSelectPreset={handleSelect} />);

      const useButton = screen.getByRole('button', { name: /Use This Preset/i });
      fireEvent.click(useButton);

      expect(handleSelect).toHaveBeenCalledWith('ca-passport-50x70');
    });

    it('provides link to official requirements', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      const externalLink = screen.getByRole('link');
      expect(externalLink).toHaveAttribute('href', 'https://www.canada.ca/passports');
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('accessibility', () => {
    it('renders button with descriptive text', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      const button = screen.getByRole('button', { name: /Use This Preset/ });
      expect(button).toBeInTheDocument();
    });

    it('external link has accessible label', () => {
      render(<PresetCardGrid presets={[mockPresets[0]]} />);

      const linkButton = screen.getByRole('button', { name: /View official requirements/i });
      expect(linkButton).toBeInTheDocument();
    });
  });
});
