import { ErrorResponse } from "./common";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  role: string;
  token: string;
}

export type LoginEndpoint = {
  request: LoginRequest;
  response: LoginResponse | ErrorResponse;
};
