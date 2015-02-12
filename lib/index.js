
import '6to5/polyfill';
import BaseController from './ez-ctrl';
import ExpressHandler from './express';
import Converter from './converter';
import Validator from './validator';
import SocketHandler from './socket';
import * as UserError from './userError';

Object.assign(UserError.default, UserError);
UserError = UserError.default;
delete UserError.default;

export default BaseController;

export {BaseController, ExpressHandler, Converter, Validator, SocketHandler, UserError};
