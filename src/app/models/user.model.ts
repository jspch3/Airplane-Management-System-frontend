export interface User {
  userId?: number;
  userName: string;
  password?: string;
  role: 'CUSTOMER' | 'ADMIN';
  customerCategory: 'SILVER' | 'GOLD' | 'PLATINUM' | 'REGULAR';
  phone: string;
  emailId: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  dob: string;
}

export interface LoginResponse {
  userId: number;
  userName: string;
  role: 'CUSTOMER' | 'ADMIN';
  customerCategory: string;
  emailId: string;
  message: string;
}
