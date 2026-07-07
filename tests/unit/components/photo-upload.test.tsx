import { afterEach, describe, expect, it, vi } from 'vitest';

import { PhotoUpload } from '../../../src/components/photo-upload';

class MockXMLHttpRequest {
  static latestInstance: MockXMLHttpRequest | null = null;

  status = 0;
  response: unknown = null;
  responseType = '';
  method: string | null = null;
  url: string | null = null;
  body: FormData | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  upload = {
    onprogress: null as ((event: ProgressEvent<EventTarget>) => void) | null,
  };

  constructor() {
    MockXMLHttpRequest.latestInstance = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(body: Document | XMLHttpRequestBodyInit | null | undefined) {
    this.body = body as FormData;
  }
}

describe('PhotoUpload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    MockXMLHttpRequest.latestInstance = null;
  });

  it('renders the input and drag-drop zone', () => {
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);

    const React = require('react');
    const ReactDOMClient = require('react-dom/client');
    const { act } = React;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    act(() => {
      root.render(React.createElement(PhotoUpload));
    });

    expect(container.querySelector('[aria-label="Photo upload dropzone"]')).not.toBeNull();
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
    expect(container.textContent).toContain('Drag and drop an image here or choose a file to upload.');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('validates the file type before upload', () => {
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);

    const React = require('react');
    const ReactDOMClient = require('react-dom/client');
    const { act } = React;

    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    act(() => {
      root.render(React.createElement(PhotoUpload));
    });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    act(() => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(container.textContent).toContain('Please upload a JPG, PNG, or WebP image.');
    expect(MockXMLHttpRequest.latestInstance).toBeNull();

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('shows dragging state while a file is over the dropzone', () => {
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);

    const React = require('react');
    const ReactDOMClient = require('react-dom/client');
    const { act } = React;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    act(() => {
      root.render(React.createElement(PhotoUpload));
    });

    const dropzone = container.querySelector('[aria-label="Photo upload dropzone"]') as HTMLDivElement;

    act(() => {
      const event = new Event('dragover', { bubbles: true, cancelable: true });
      dropzone.dispatchEvent(event);
    });

    expect(container.textContent).toContain('Drop your photo here');
    expect(container.textContent).toContain('Drop the image to start uploading.');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
