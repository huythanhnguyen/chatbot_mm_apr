import React from 'react';

export const formatProductResults = (products) => {
  if (!products.data || !products.data.products || !products.data.products.items) {
    return 'Không tìm thấy sản phẩm nào phù hợp.';
  }
  
  const items = products.data.products.items;
  let response = `Tôi đã tìm thấy ${items.length} sản phẩm:\n\n`;
  
  items.forEach((item, index) => {
    response += `${index + 1}. **${item.name}**\n`;
    if (item.price_range && item.price_range.maximum_price) {
      const price = item.price_range.maximum_price.final_price;
      response += `   Giá: ${price.value.toLocaleString()} ${price.currency}\n`;
    }
    response += `   SKU: ${item.sku}\n\n`;
  });
  
  response += 'Bạn có muốn xem chi tiết sản phẩm nào không?';
  return response;
};

export const formatProductDetails = (productData) => {
  if (!productData.data || !productData.data.products || !productData.data.products.items || productData.data.products.items.length === 0) {
    return 'Không tìm thấy thông tin sản phẩm.';
  }
  
  const product = productData.data.products.items[0];
  let details = `## ${product.name}\n\n`;
  
  if (product.price_range && product.price_range.maximum_price) {
    const price = product.price_range.maximum_price.final_price;
    details += `**Giá:** ${price.value.toLocaleString()} ${price.currency}\n\n`;
  }
  
  if (product.description) {
    // Loại bỏ HTML tags
    const description = product.description.html.replace(/<[^>]*>/g, '');
    details += `**Mô tả:** ${description}\n\n`;
  }
  
  details += `**SKU:** ${product.sku}\n\n`;
  
  if (product.unit_ecom) {
    details += `**Đơn vị:** ${product.unit_ecom}\n\n`;
  }
  
  details += 'Bạn có muốn thêm sản phẩm này vào giỏ hàng không?';
  return details;
};

export const formatAddToCartResponse = (response) => {
  if (response.data && response.data.addProductsToCart && response.data.addProductsToCart.cart) {
    return '✅ Đã thêm sản phẩm vào giỏ hàng thành công!';
  } else if (response.data && response.data.addProductsToCart && response.data.addProductsToCart.user_errors) {
    const errors = response.data.addProductsToCart.user_errors;
    return `❌ Không thể thêm sản phẩm vào giỏ hàng: ${errors[0].message}`;
  }
  return '❌ Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.';
};

export const formatCartResponse = (cartData) => {
  if (!cartData.data || !cartData.data.cart || !cartData.data.cart.items) {
    return 'Giỏ hàng của bạn hiện đang trống.';
  }
  
  const items = cartData.data.cart.items;
  let response = `## Giỏ hàng của bạn\n\n`;
  
  items.forEach((item, index) => {
    response += `${index + 1}. **${item.product.name}**\n`;
    response += `   Số lượng: ${item.quantity}\n`;
    if (item.prices && item.prices.price) {
      response += `   Đơn giá: ${item.prices.price.value.toLocaleString()} ${item.prices.price.currency}\n`;
    }
    response += `   SKU: ${item.product.sku}\n\n`;
  });
  
  if (cartData.data.cart.prices && cartData.data.cart.prices.grand_total) {
    const total = cartData.data.cart.prices.grand_total;
    response += `**Tổng cộng:** ${total.value.toLocaleString()} ${total.currency}\n\n`;
  }
  
  response += 'Bạn có muốn thanh toán không?';
  return response;
};

export const formatCheckoutResponse = (checkoutData) => {
  if (checkoutData.redirect_url) {
    return `Đã tạo đơn hàng thành công! Vui lòng truy cập link sau để thanh toán:\n\n${checkoutData.redirect_url}`;
  }
  
  return 'Có lỗi xảy ra khi bắt đầu thanh toán.';
};