// Who gets paid for each corner, and how. Edit the bank names and numbers
// here — this is the only place they live.
//
// qrisPath: put the image in public/images/payment/ (see README).
export const PAYMENTS = {
  salad: {
    name: 'Zack',
    qrisPath: '/images/payment/qris-zac.png',
    banks: [{ bank: 'BANK MANDIRI', number: '1300028849506' }],
  },
  coffee: {
    name: 'Vel',
    qrisPath: '/images/payment/qris-vel.jpg',
    banks: [
      { bank: 'BANK BCA', number: '7940423851' },
      { bank: 'BANK JAGO', number: '106747962160' },
      { bank: 'BANK MANDIRI', number: '1300028849340' },
    ],
  },
}
