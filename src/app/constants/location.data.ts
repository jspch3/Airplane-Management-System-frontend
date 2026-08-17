export const INDIAN_STATES: string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const MAJOR_AIRPORTS: string[] = [
  'Mumbai (BOM)',
  'Delhi (DEL)',
  'Bengaluru (BLR)',
  'Hyderabad (HYD)',
  'Chennai (MAA)',
  'Kolkata (CCU)',
  'Ahmedabad (AMD)',
  'Pune (PNQ)',
  'Goa (GOI)',
  'Kochi (COK)'
];

export interface PincodeLocation {
  city: string;
  state: string;
}

export const PINCODE_MAP: Record<string, PincodeLocation> = {
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400002': { city: 'Mumbai', state: 'Maharashtra' },
  '400050': { city: 'Mumbai', state: 'Maharashtra' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '440001': { city: 'Nagpur', state: 'Maharashtra' },
  '110001': { city: 'Delhi', state: 'Delhi' },
  '110002': { city: 'Delhi', state: 'Delhi' },
  '110020': { city: 'Delhi', state: 'Delhi' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560002': { city: 'Bengaluru', state: 'Karnataka' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '500002': { city: 'Hyderabad', state: 'Telangana' },
  '520001': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '600002': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '700002': { city: 'Kolkata', state: 'West Bengal' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '380002': { city: 'Ahmedabad', state: 'Gujarat' },
  '682001': { city: 'Kochi', state: 'Kerala' },
  '682002': { city: 'Kochi', state: 'Kerala' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '160017': { city: 'Chandigarh', state: 'Punjab' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '800001': { city: 'Patna', state: 'Bihar' }
};

export function lookupPincode(pincode: string): PincodeLocation | null {
  if (!pincode || pincode.length !== 6) return null;
  if (PINCODE_MAP[pincode]) return PINCODE_MAP[pincode];

  const prefix2 = pincode.substring(0, 2);

  if (prefix2 === '40' || prefix2 === '42' || prefix2 === '43' || prefix2 === '44') {
    return { city: 'Mumbai', state: 'Maharashtra' };
  } else if (prefix2 === '41') {
    return { city: 'Pune', state: 'Maharashtra' };
  } else if (prefix2 === '11') {
    return { city: 'Delhi', state: 'Delhi' };
  } else if (prefix2 === '56' || prefix2 === '57' || prefix2 === '58' || prefix2 === '59') {
    return { city: 'Bengaluru', state: 'Karnataka' };
  } else if (prefix2 === '50') {
    return { city: 'Hyderabad', state: 'Telangana' };
  } else if (prefix2 === '52') {
    return { city: 'Vijayawada', state: 'Andhra Pradesh' };
  } else if (prefix2 === '53') {
    return { city: 'Visakhapatnam', state: 'Andhra Pradesh' };
  } else if (prefix2 === '60' || prefix2 === '61' || prefix2 === '62' || prefix2 === '63' || prefix2 === '64') {
    return { city: 'Chennai', state: 'Tamil Nadu' };
  } else if (prefix2 === '70' || prefix2 === '71' || prefix2 === '72' || prefix2 === '73' || prefix2 === '74') {
    return { city: 'Kolkata', state: 'West Bengal' };
  } else if (prefix2 === '38' || prefix2 === '39') {
    return { city: 'Ahmedabad', state: 'Gujarat' };
  } else if (prefix2 === '68' || prefix2 === '69') {
    return { city: 'Kochi', state: 'Kerala' };
  }

  // Return null if pincode prefix is not recognized, so customer can select State and type City manually
  return null;
}
