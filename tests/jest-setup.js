import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

console.warn = jest.fn();

Enzyme.configure({ adapter: new Adapter() });

const htmlTag = document.getElementsByTagName('html')[0];
htmlTag.setAttribute('dir', 'ltr');
