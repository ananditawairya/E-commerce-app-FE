import { gql } from '@apollo/client';

/**
 * GraphQL mutation definitions used by the mobile frontend.
 */

/** Registers a new user account. */
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

/** Logs in an existing user account. */
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

/** Adds a product variant to the buyer cart. */
export const ADD_TO_CART = gql`
  mutation AddToCart($productId: String!, $productName: String!, $variantId: String, $variantName: String, $quantity: Int!, $price: Float!){
    addToCart(productId: $productId, productName: $productName, variantId: $variantId, variantName: $variantName, quantity: $quantity, price: $price) {
      id,
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

/** Updates quantity for an existing cart item. */
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

/** Removes an item from the buyer cart. */
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

/** Clears all items from the buyer cart. */
export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart
  }
`;

/** Places a checkout order using the selected shipping address. */
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

/** Creates a new product for the authenticated seller. */
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

/** Updates an existing seller product. */
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

/** Deletes a seller product. */
export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

/** Updates seller order status. */
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

/** Cancels a seller order. */
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

/** Tracks a product analytics event. */
export const TRACK_EVENT = gql`
  mutation TrackEvent(
    $userId: ID!
    $productId: ID!
    $eventType: String!
    $category: String
    $metadata: String
  ) {
    trackEvent(
      userId: $userId
      productId: $productId
      eventType: $eventType
      category: $category
      metadata: $metadata
    ) {
      success
      message
    }
  }
`;

/** Sends a message to the AI shopping assistant. */
export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage(
    $userId: ID!
    $message: String!
    $conversationId: String
  ) {
    sendChatMessage(
      userId: $userId
      message: $message
      conversationId: $conversationId
    ) {
      message
      followUpQuestion
      appliedFilters
      latencyMs
      cacheHit
      safetyBlocked
      semanticUsed
      products {
        id
        name
        description
        category
        basePrice
        images
        variants {
          id
          name
          priceModifier
          stock
        }
      }
      conversationId
    }
  }
`;

/** Adds a new shipping address for the authenticated buyer. */
export const ADD_ADDRESS = gql`
  mutation AddAddress($address: AddressInput!) {
    addAddress(address: $address) {
      id
      street
      city
      state
      zipCode
      country
      isDefault
    }
  }
`;

/** Updates an existing buyer address. */
export const UPDATE_ADDRESS = gql`
  mutation UpdateAddress($id: ID!, $address: AddressInput!) {
    updateAddress(id: $id, address: $address) {
      id
      street
      city
      state
      zipCode
      country
      isDefault
    }
  }
`;

/** Removes a buyer address. */
export const REMOVE_ADDRESS = gql`
  mutation RemoveAddress($id: ID!) {
    removeAddress(id: $id)
  }
`;

/** Marks a buyer address as the default address. */
export const SET_DEFAULT_ADDRESS = gql`
  mutation SetDefaultAddress($id: ID!) {
    setDefaultAddress(id: $id)
  }
`;
