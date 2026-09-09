import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SellerDataProvider, useSellerData } from '../SellerDataContext';

// Simple wrapper helper
const createWrapper = (approved = true) => {
  return ({ children }) => (
    <SellerDataProvider approved={approved}>
      {children}
    </SellerDataProvider>
  );
};

describe('SellerDataContext CRUD and Validation', () => {
  beforeEach(() => {
    // Clear localStorage and mocks
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('allows adding a valid product and calculates values', () => {
    const { result } = renderHook(() => useSellerData(), {
      wrapper: createWrapper(true)
    });

    act(() => {
      result.current.addProduct({
        name: 'DPS Winter Blazer (Size 34)',
        category: 'uniforms',
        price: 1299,
        sizes: ['32', '34', '36'],
        gender: 'Boys',
        stockQuantity: 45
      });
    });

    const added = result.current.products.find(p => p.name === 'DPS Winter Blazer (Size 34)');
    expect(added).toBeDefined();
    expect(added.price).toBe(1299);
    expect(added.stockQuantity).toBe(45);
    expect(added.inStock).toBe(true);
  });

  it('rejects product with missing name or invalid price', () => {
    const { result } = renderHook(() => useSellerData(), {
      wrapper: createWrapper(true)
    });

    expect(() => {
      act(() => {
        result.current.addProduct({
          name: '',
          price: 500
        });
      });
    }).toThrow(/Product name is required/);

    expect(() => {
      act(() => {
        result.current.addProduct({
          name: 'Valid Name',
          price: 0
        });
      });
    }).toThrow(/price must be greater than 0/);
  });

  it('blocks mutations when seller is not approved (role-based check)', () => {
    const { result } = renderHook(() => useSellerData(), {
      wrapper: createWrapper(false)
    });

    expect(() => {
      act(() => {
        result.current.addProduct({
          name: 'Unauthorized Product',
          price: 999
        });
      });
    }).toThrow(/Permission denied/);

    expect(() => {
      act(() => {
        result.current.deleteProduct(1);
      });
    }).toThrow(/Permission denied/);
  });

  it('edits and deletes product successfully', () => {
    const { result } = renderHook(() => useSellerData(), {
      wrapper: createWrapper(true)
    });

    let newProd;
    act(() => {
      newProd = result.current.addProduct({
        name: 'Test Uniform Tie',
        price: 199,
        stockQuantity: 10
      });
    });

    act(() => {
      result.current.editProduct(newProd.id, {
        price: 249,
        stockQuantity: 15
      });
    });

    const updated = result.current.products.find(p => p.id === newProd.id);
    expect(updated.price).toBe(249);
    expect(updated.stockQuantity).toBe(15);

    act(() => {
      result.current.deleteProduct(newProd.id);
    });

    const deleted = result.current.products.find(p => p.id === newProd.id);
    expect(deleted).toBeUndefined();
  });

  it('requires a positive stock count before reactivating an out-of-stock product', () => {
    const { result } = renderHook(() => useSellerData(), {
      wrapper: createWrapper(true)
    });

    let newProd;
    act(() => {
      newProd = result.current.addProduct({
        name: 'Out of Stock Product',
        price: 499,
        stockQuantity: 0
      });
    });

    expect(() => {
      act(() => {
        result.current.toggleProductStatus(newProd.id);
      });
    }).toThrow(/positive stock/i);

    act(() => {
      result.current.toggleProductStatus(newProd.id, 25);
    });

    const updated = result.current.products.find(p => p.id === newProd.id);
    expect(updated.inStock).toBe(true);
    expect(updated.stockQuantity).toBe(25);
  });

  it('handles orders and status updates', () => {
    const { result } = renderHook(() => useSellerData(), {
      wrapper: createWrapper(true)
    });

    let newOrder;
    act(() => {
      newOrder = result.current.addOrder({
        customerName: 'Aarav Gupta',
        total: 1599,
        school: 'DPS Noida'
      });
    });

    expect(newOrder.status).toBe('Pending');

    act(() => {
      result.current.updateOrderStatus(newOrder.id, 'Shipped');
    });

    const updated = result.current.orders.find(o => o.id === newOrder.id);
    expect(updated.status).toBe('Shipped');
  });

  it('handles promotions creation, editing and deletion', () => {
    const { result } = renderHook(() => useSellerData(), {
      wrapper: createWrapper(true)
    });

    let promo;
    act(() => {
      promo = result.current.addPromotion({
        code: 'TESTSAVE20',
        discountValue: 20
      });
    });

    expect(promo.code).toBe('TESTSAVE20');
    expect(promo.discountValue).toBe(20);

    act(() => {
      result.current.togglePromotionStatus(promo.id);
    });

    const toggled = result.current.promotions.find(p => p.id === promo.id);
    expect(toggled.status).toBe('expired');
  });

  it('defaults to approved=true when wrapper does not specify approved prop', () => {
    const { result } = renderHook(() => useSellerData(), {
      wrapper: ({ children }) => <SellerDataProvider>{children}</SellerDataProvider>
    });

    expect(result.current.isApproved).toBe(true);
    // Mutations are allowed without error
    expect(() => {
      act(() => {
        result.current.addProduct({
          name: 'Demo Allowed Product',
          price: 100
        });
      });
    }).not.toThrow();
  });
});
