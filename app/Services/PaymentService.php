<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    /**
     * Create escrowed payment when order is confirmed
     */
    public function createEscrowedPayment(Order $order): ?Payment
    {
        try {
            return Payment::create([
                'order_id' => $order->id,
                'amount' => $order->total_price,
                'status' => 'escrowed',
                'payment_method' => $order->payment_method,
                'escrowed_at' => now(),
            ]);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Release escrowed payment after delivery is confirmed
     */
    public function releasePayment(Order $order): bool
    {
        $payment = $order->payment;

        if (!$payment) {
            return false;
        }

        if ($payment->status !== 'escrowed') {
            return false;
        }

        try {
            $payment->release();

            // Broadcast payment released event
            // broadcast(new PaymentReleased($payment));

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Refund escrowed payment (on cancellation or rejection)
     */
    public function refundPayment(Order $order): bool
    {
        $payment = $order->payment;

        if (!$payment) {
            return false;
        }

        if ($payment->status !== 'escrowed') {
            return false;
        }

        try {
            $payment->refund();

            // Broadcast payment refunded event
            // broadcast(new PaymentRefunded($payment));

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get payment status for order
     */
    public function getPaymentStatus(int $orderId): array
    {
        $order = Order::find($orderId);
        if (!$order) {
            return ['error' => 'Order not found'];
        }

        $payment = $order->payment;
        if (!$payment) {
            return ['error' => 'Payment not found'];
        }

        return [
            'order_id' => $order->id,
            'amount' => $payment->amount,
            'status' => $payment->status,
            'payment_method' => $payment->payment_method,
            'order_status' => $order->status,
            'escrowed_at' => $payment->escrowed_at,
            'released_at' => $payment->released_at,
            'refunded_at' => $payment->refunded_at,
        ];
    }

    /**
     * Get producer earnings (released payments)
     */
    public function getProducerEarnings(int $producerId): array
    {
        // Get all delivered orders from this producer
        $orders = Order::where('producer_id', $producerId)
            ->where('status', 'delivered')
            ->with('payment')
            ->get();

        $totalEarnings = 0;
        $releasedPayments = 0;
        $pendingReleaseCount = 0;

        foreach ($orders as $order) {
            if ($order->payment) {
                if ($order->payment->status === 'released') {
                    $totalEarnings += $order->payment->amount;
                    $releasedPayments++;
                } elseif ($order->payment->status === 'escrowed') {
                    $pendingReleaseCount++;
                }
            }
        }

        return [
            'producer_id' => $producerId,
            'total_earnings' => $totalEarnings,
            'released_payments_count' => $releasedPayments,
            'pending_releases_count' => $pendingReleaseCount,
            'total_delivered_orders' => $orders->count(),
        ];
    }

    /**
     * Get payment analytics
     */
    public function getPaymentAnalytics(): array
    {
        $total = Payment::sum('amount');
        $escrowed = Payment::where('status', 'escrowed')->sum('amount');
        $released = Payment::where('status', 'released')->sum('amount');
        $refunded = Payment::where('status', 'refunded')->sum('amount');

        $escrowedCount = Payment::where('status', 'escrowed')->count();
        $releasedCount = Payment::where('status', 'released')->count();
        $refundedCount = Payment::where('status', 'refunded')->count();

        return [
            'total_value' => $total,
            'by_status' => [
                'escrowed' => [
                    'amount' => $escrowed,
                    'count' => $escrowedCount,
                ],
                'released' => [
                    'amount' => $released,
                    'count' => $releasedCount,
                ],
                'refunded' => [
                    'amount' => $refunded,
                    'count' => $refundedCount,
                ],
            ],
        ];
    }

    /**
     * Process pending payments (handle edge cases)
     */
    public function processPendingPayments(): array
    {
        $results = [
            'released' => 0,
            'refunded' => 0,
            'failed' => 0,
        ];

        try {
            DB::beginTransaction();

            // Release payments for orders that have been delivered for 24+ hours
            $autoReleasePayments = Payment::where('status', 'escrowed')
                ->where('escrowed_at', '<', now()->subHours(24))
                ->whereHas('order', function ($q) {
                    $q->where('status', 'delivered');
                })
                ->get();

            foreach ($autoReleasePayments as $payment) {
                $payment->release();
                $results['released']++;
            }

            // Refund payments for orders that have been cancelled
            $refundPayments = Payment::where('status', 'escrowed')
                ->whereHas('order', function ($q) {
                    $q->whereIn('status', ['cancelled', 'rejected']);
                })
                ->get();

            foreach ($refundPayments as $payment) {
                $payment->refund();
                $results['refunded']++;
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $results['failed'] = 1;
        }

        return $results;
    }
}
