import LocalStorageMock from './local-storage-mock';

jest.spyOn(console, 'warn').mockImplementation(() => {});

const htmlTag = document.getElementsByTagName('html')[0];
htmlTag.setAttribute('dir', 'ltr');

global.localStorage = new LocalStorageMock;
