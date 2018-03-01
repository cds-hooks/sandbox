import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

console.warn = jest.fn();

Enzyme.configure({ adapter: new Adapter() });
