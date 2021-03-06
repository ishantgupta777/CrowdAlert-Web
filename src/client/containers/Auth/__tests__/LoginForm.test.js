import React from 'react';
import Enzyme, { shallow, mount } from 'enzyme';
import EnzymeAdapter from 'enzyme-adapter-react-16';
import { findByTestAttr, storeFactory, checkProps } from '../../../tests/testUtils';
import LoginForm from '../Loginform';

Enzyme.configure({ adapter: new EnzymeAdapter() });

const defaultProps = {
  static: false,
  size: 'huge',
  circular: true,
  fetchOnLoad: false,
  floated: 'right',
};

const reduxPiece = {
  auth: {
    loginForm: {
      errors: false,
      message: null,
      loading: true,
    }
  }
};

/**
 * @function setup
 * @param {object} state - State for this setup.
 * @returns {ShallowWrapper}
 */
const setup = (props = {}, initialReduxState = {}) => {
  const store = storeFactory(initialReduxState);
  const setupProps = { ...defaultProps, ...props };
  const wrapper = shallow(<LoginForm {...setupProps} store={store} />);
  return wrapper;
};

test('does not throw warning with expected props', () => {
  const expectedProps = {
    submitEmailPasswordAuthentication: jest.fn(),
    loginForm: {
      errors: false,
      message: null,
      loading: true,
    }
  };

  checkProps(LoginForm, expectedProps);
});

describe('render', () => {
  test('renders without errors', () => {
    const wrapper = setup({}, reduxPiece).dive();
    expect(findByTestAttr(wrapper, 'component-login-form').length).toBe(1);
  });

  test('does not render errors', () => {
    const wrapper = setup({}, reduxPiece).dive();
    expect(findByTestAttr(wrapper, 'login-errors').length).toBe(0);
  });

  test('renders email field without errors', () => {
    const wrapper = setup({}, reduxPiece).dive();
    expect(findByTestAttr(wrapper, 'form-email').length).toBe(1);
  });

  test('renders  password field without errors', () => {
    const wrapper = setup({}, reduxPiece).dive();
    expect(findByTestAttr(wrapper, 'form-password').length).toBe(1);
  });

  test('renders button without errors', () => {
    const wrapper = setup({}, reduxPiece).dive();
    expect(findByTestAttr(wrapper, 'form-btn-login').length).toBe(1);
  });
});

describe('redux props', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = setup({}, reduxPiece);
  });

  test('has redux piece of state', () => {
    const reduxProps = {
      auth: {
        loginForm: wrapper.props().loginForm
      }
    };

    expect(reduxProps).toEqual(reduxPiece);
  });

  test('"submitEmailPasswordAuthentication" action creator', () => {
    const submitEmailPasswordAuthenticationProps = wrapper.props().submitEmailPasswordAuthentication;
    expect(submitEmailPasswordAuthenticationProps).toBeInstanceOf(Function);
  });
});
