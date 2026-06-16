/**
 * order controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    // Cari order terakhir berdasarkan createdAt (urutan terbaru)
    const lastOrder = await strapi.entityService.findMany('api::order.order', {
      sort: { createdAt: 'desc' },
      limit: 1,
      fields: ['order_no'],
    });

    let nextNumber = 1;

    if (lastOrder && lastOrder.length > 0 && lastOrder[0].order_no) {
      const lastOrderNo = lastOrder[0].order_no;
      const parsed = parseInt(lastOrderNo, 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }

    // Format jadi 4 digit, misal: 0001, 0002, ..., 0099, 0100, dst
    const order_no = String(nextNumber).padStart(4, '0');

    // Inject order_no ke body request
    ctx.request.body.data = {
      ...ctx.request.body.data,
      order_no,
    };

    // Lanjut ke create default
    const response = await super.create(ctx);
    return response;
  },
}));