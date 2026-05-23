import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { ImageUpload } from '../ImageUpload';

function createFile(name: string, size: number, type: string) {
  const file = new File([new ArrayBuffer(size)], name, { type });
  return file;
}

describe('ImageUpload', () => {
  it('validates file type before upload', async () => {
    const onUpload = jest.fn(() => Promise.resolve());
    const { getByTestId, findByTestId } = render(
      <ImageUpload onUpload={onUpload} acceptedTypes={['image/png']} />
    );
    const input = getByTestId('image-input') as HTMLInputElement;
    const file = createFile('test.jpg', 1000, 'image/jpeg');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(await findByTestId('error-msg')).toHaveTextContent('Invalid file type');
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('validates file size before upload', async () => {
    const onUpload = jest.fn(() => Promise.resolve());
    const { getByTestId, findByTestId } = render(
      <ImageUpload onUpload={onUpload} maxSizeMB={0.001} />
    );
    const input = getByTestId('image-input') as HTMLInputElement;
    const file = createFile('big.png', 2000, 'image/png');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(await findByTestId('error-msg')).toHaveTextContent('File is too large');
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('shows upload progress and calls onUpload', async () => {
    const onUpload = jest.fn(() => Promise.resolve());
    const { getByTestId, queryByTestId } = render(
      <ImageUpload onUpload={onUpload} />
    );
    const input = getByTestId('image-input') as HTMLInputElement;
    const file = createFile('ok.png', 1000, 'image/png');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    // Progress bar should appear
    expect(getByTestId('progress-bar')).toBeInTheDocument();
    // Wait for upload to finish
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
    // Progress bar should reach 100
    expect(getByTestId('progress-bar').style.width).toBe('100%');
    // No error
    expect(queryByTestId('error-msg')).toBeNull();
  });

  it('displays upload errors', async () => {
    const onUpload = jest.fn(() => Promise.reject(new Error('fail')));
    const { getByTestId, findByTestId } = render(
      <ImageUpload onUpload={onUpload} />
    );
    const input = getByTestId('image-input') as HTMLInputElement;
    const file = createFile('ok.png', 1000, 'image/png');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(await findByTestId('error-msg')).toHaveTextContent('fail');
  });
});
