import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($email: String!, $password: String!, $name: String!, $role: String!) {
    register(email: $email, password: $password, name: $name, role: $role) {
      user {
        id
        email
        name
        role
      }
      accessToken
      refreshToken
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        email
        name
        role
      }
      accessToken
      refreshToken
    }
  }
`;

export const ADD_TO_CART = gql`
  mutation AddToCart($productId: String!, $variantId: String, $quantity: Int!, $price: Float!) {
    addToCart(productId: $productId, variantId: $variantId, quantity: $quantity, price: $price) {
      id,
      userId
      items {
        id
        productId
        variantId
        quantity
        price
      }
      totalAmount
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($productId: String!, $variantId: String, $quantity: Int!) {
    updateCartItem(productId: $productId, variantId: $variantId, quantity: $quantity) {
      id
      userId
      items {
        id
        productId
        variantId
        quantity
        price
      }
      totalAmount
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($productId: String!, $variantId: String) {
    removeFromCart(productId: $productId, variantId: $variantId) {
      id
      userId
      items {
        id
        productId
        variantId
        quantity
        price
      }
      totalAmount
    }
  }
`;

export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart
  }
`;

export const CHECKOUT = gql`
  mutation Checkout($shippingAddress: ShippingAddressInput!) {
    checkout(shippingAddress: $shippingAddress) {
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

// CHANGE: Enhanced CREATE_PRODUCT to return all fields including formatted description
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
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

// CHANGE: Enhanced UPDATE_PRODUCT to return all fields including formatted description
export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductUpdateInput!) {
    updateProduct(id: $id, input: $input) {
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

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      orderId
      buyerId
      totalAmount
      status
      createdAt
      updatedAt
    }
  }
`;

// CHANGE: Add cancel order mutation
export const CANCEL_ORDER = gql`
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      id
      orderId
      buyerId
      totalAmount
      status
      createdAt
      updatedAt
    }
  }
`;