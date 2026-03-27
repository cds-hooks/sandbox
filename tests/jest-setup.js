import LocalStorageMock from './local-storage-mock';

console.warn = jest.fn();

const htmlTag = document.getElementsByTagName('html')[0];
htmlTag.setAttribute('dir', 'ltr');

global.localStorage = new LocalStorageMock;
