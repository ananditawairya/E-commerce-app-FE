// mobile/src/graphql/queries.js

import { gql } from '@apollo/client';

// CHANGE: Enhanced GET_PRODUCTS to include formattedDescription and effectivePrice for variants
export const GET_PRODUCTS = gql`
  query GetProducts($search: String, $category: String, $limit: Int, $offset: Int) {
    products(search: $search, category: $category, limit: $limit, offset: $offset) {
      id
      name
      description
      formattedDescription
      category
      basePrice
      images
      isActive
      variants {
        id
        name
        description
        images
        priceModifier
        stock
        sku
        effectiveDescription
        effectiveImages
        effectivePrice
      }
      createdAt
      updatedAt
    }
  }
`;

// CHANGE: Enhanced GET_PRODUCT to include all variant fields and formatted description
export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      formattedDescription
      category
      basePrice
      images
      isActive
      variants {
        id
        name
        description
        images
        priceModifier
        stock
        sku
        effectiveDescription
        effectiveImages
        effectivePrice
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories
  }
`;

export const GET_MY_CART = gql`
  query GetMyCart {
    myCart {
      id
      userId
      items {
        id
        productId
        productName
        variantId
        variantName
        quantity
        price
      }
      totalAmount
    }
  }
`;

export const GET_MY_ORDERS = gql`
  query GetMyOrders {
    myOrders {
      id
      orderId
      buyerId
      items {
        productId
        productName
        variantId
        variantName
        quantity
        price
        sellerId
      }
      totalAmount
      status
      shippingAddress {
        street
        city
        state
        zipCode
        country
      }
      paymentMethod
      createdAt
      updatedAt
    }
  }
`;

// CHANGE: Enhanced GET_SELLER_PRODUCTS to include all product and variant fields
export const GET_SELLER_PRODUCTS = gql`
  query GetSellerProducts {
    sellerProducts {
      id
      sellerId
      name
      description
      formattedDescription
      category
      basePrice
      images
      isActive
      variants {
        id
        name
        description
        images
        priceModifier
        stock
        sku
        effectiveDescription
        effectiveImages
        effectivePrice
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_SELLER_ORDERS = gql`
  query GetSellerOrders {
    sellerOrders {
      id
      orderId
      buyerId
      items {
        productId
        productName
        variantId
        variantName
        quantity
        price
        sellerId
      }
      totalAmount
      status
      shippingAddress {
        street
        city
        state
        zipCode
        country
      }
      paymentMethod
      createdAt
      updatedAt
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderId
      buyerId
      items {
        productId
        productName
        variantId
        variantName
        quantity
        price
        sellerId
      }
      totalAmount
      status
      shippingAddress {
        street
        city
        state
        zipCode
        country
      }
      paymentMethod
      createdAt
      updatedAt
    }
  }
`;