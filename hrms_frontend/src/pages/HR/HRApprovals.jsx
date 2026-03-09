import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout/Layout';
import axiosInstance from '../../utils/axiosConfig';
import { API_ENDPOINTS } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import { useAppState } from '../../context/AppStateContext';

const HRApprovals = () => {
  const { showToast } = useToast();
  const { refreshNotifications, refreshPendingCounts } = useAppState();
  const [documents, setDocuments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [message, setMessage] = useState('');
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await axiosInstance.get(`${API_ENDPOINTS.DOCUMENTS.GET}/pending`);
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.TIME.LEAVE_PENDING);
      setLeaves(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setLeaves([]);
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadLeaves();
  }, []);

  const approveDoc = async (documentId) => {
    if (!documentId) {
      showToast({ type: 'error', title: 'Action failed', message: 'Document id is missing.' });
      return;
    }
    setMessage('');
    try {
      await axiosInstance.put(`${API_ENDPOINTS.DOCUMENTS.GET}/${documentId}/approve`);
      setMessage('Document approved.');
      loadDocuments();
      // Refresh dashboard counts immediately after approval
      refreshNotifications();
      refreshPendingCounts();
      showToast({ type: 'success', title: 'Document approved', message: 'Document has been approved successfully.' });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Document approval failed.');
      showToast({ type: 'error', title: 'Approval failed', message: error.response?.data?.message || 'Document approval failed.' });
    }
  };

  const viewDocument = async (documentId) => {
    if (!documentId) {
      showToast({ type: 'error', title: 'Action failed', message: 'Document id is missing.' });
      return;
    }
    setMessage('');
    try {
      const res = await axiosInstance.get(`${API_ENDPOINTS.DOCUMENTS.GET}/${documentId}/download`);
      const url = res.data;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to open document.');
    }
  };

  const rejectDoc = async (documentId) => {
    if (!documentId) {
      showToast({ type: 'error', title: 'Action failed', message: 'Document id is missing.' });
      return;
    }
    const reason = rejectReason.trim();
    if (!reason) {
      setMessage('Rejection reason is required.');
      return;
    }
    setMessage('');
    try {
      setRejectSubmitting(true);
      await axiosInstance.put(`${API_ENDPOINTS.DOCUMENTS.GET}/${documentId}/reject`, { reason });
      setMessage('Document rejected.');
      setRejectingDocId(null);
      setRejectReason('');
      setShowRejectModal(false);
      loadDocuments();
      // Refresh dashboard counts immediately after rejection
      refreshNotifications();
      refreshPendingCounts();
      showToast({ type: 'success', title: 'Document rejected', message: 'Document has been rejected successfully.' });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Document rejection failed.');
      showToast({ type: 'error', title: 'Rejection failed', message: error.response?.data?.message || 'Document rejection failed.' });
    } finally {
      setRejectSubmitting(false);
    }
  };

  const startReject = (documentId) => {
    setMessage('');
    setRejectingDocId(documentId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const cancelReject = () => {
    setRejectingDocId(null);
    setRejectReason('');
    setShowRejectModal(false);
  };

  const approveLeave = async (leaveRequestId) => {
    if (!leaveRequestId) {
      showToast({ type: 'error', title: 'Action failed', message: 'Leave request id is missing.' });
      return;
    }
    setMessage('');
    try {
      await axiosInstance.put(`${API_ENDPOINTS.TIME.LEAVE_APPROVE}/${leaveRequestId}/approve`);
      setMessage('Leave approved.');
      loadLeaves();
      // Refresh dashboard counts immediately after approval
      refreshNotifications();
      refreshPendingCounts();
      showToast({ type: 'success', title: 'Leave approved', message: 'Leave request has been approved successfully.' });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Leave approval failed.');
      showToast({ type: 'error', title: 'Approval failed', message: error.response?.data?.message || 'Leave approval failed.' });
    }
  };

  const rejectLeave = async (leaveRequestId) => {
    if (!leaveRequestId) {
      showToast({ type: 'error', title: 'Action failed', message: 'Leave request id is missing.' });
      return;
    }
    setMessage('');
    try {
      await axiosInstance.put(`${API_ENDPOINTS.TIME.LEAVE_REJECT}/${leaveRequestId}/reject`);
      setMessage('Leave rejected.');
      loadLeaves();
      // Refresh dashboard counts immediately after rejection
      refreshNotifications();
      refreshPendingCounts();
      showToast({ type: 'success', title: 'Leave rejected', message: 'Leave request has been rejected successfully.' });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Leave rejection failed.');
      showToast({ type: 'error', title: 'Rejection failed', message: error.response?.data?.message || 'Leave rejection failed.' });
    }
  };

  return (
    <Layout>
      <div className="container-fluid page-gradient">
        <div className="mb-4">
          <h2 className="fw-bold">Approvals</h2>
          <p className="text-muted mb-0">Review documents and leave requests</p>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Pending Documents</h5>
                {loadingDocs ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status" />
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-muted mb-0">No pending documents.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc, index) => {
                          const status = doc.status || '';
                          const isPending = status === 'PENDING_VERIFICATION' || status === 'PENDING';
                          const docId = doc.documentId || doc.id;
                          const description =
                            doc.rejectionReason ||
                            doc.reason ||
                            doc.comments ||
                            doc.remarks ||
                            doc.statusMessage ||
                            doc.approvalReason ||
                            '-';
                          return (
                          <tr key={docId || `doc-${index}`}>
                            <td className="fw-semibold">{doc.documentName || doc.name}</td>
                            <td>{doc.documentType || doc.type || '-'}</td>
                            <td className="small text-muted">{description}</td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => viewDocument(docId)}
                                >
                                  View/Download
                                </button>
                                {isPending ? (
                                  <>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => startReject(docId)}
                                    >
                                      Reject
                                    </button>
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => approveDoc(docId)}
                                    >
                                      Approve
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Pending Leaves</h5>
                {loadingLeaves ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status" />
                  </div>
                ) : leaves.length === 0 ? (
                  <p className="text-muted mb-0">No pending leaves.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Employee Id</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Description</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((l, index) => {
                          const description =
                            l.reason ||
                            l.comments ||
                            l.remarks ||
                            l.statusMessage ||
                            '-';
                          return (
                            <tr key={l.leaveRequestId || l.id || `leave-${index}`}>
                              <td>{l.employeeId}</td>
                              <td>{l.fromDate || '-'}</td>
                              <td>{l.toDate || '-'}</td>
                              <td className="small text-muted">{description}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                  <button className="btn btn-sm btn-outline-success" onClick={() => approveLeave(l.leaveRequestId || l.id)}>
                                    Approve
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => rejectLeave(l.leaveRequestId || l.id)}>
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }}>
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ background: 'rgba(15, 23, 42, 0.45)' }}
            onClick={cancelReject}
          />
          <div className="position-relative d-flex align-items-center justify-content-center h-100 px-3">
            <div className="bg-white rounded-4 shadow-lg p-4 w-100" style={{ maxWidth: '520px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="fw-bold mb-0">Reject Document</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={cancelReject} />
              </div>
              <p className="text-muted mb-3">
                Add a short reason so the employee understands what needs to be fixed.
              </p>
              <label className="form-label fw-semibold">Rejection reason</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="e.g., Document is blurry, please reupload a clear copy."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">
                  {rejectReason.trim().length} / 200
                </small>
                <small className="text-muted">Required</small>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cancelReject}
                  disabled={rejectSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => rejectDoc(rejectingDocId)}
                  disabled={rejectSubmitting || !rejectReason.trim()}
                >
                  {rejectSubmitting ? 'Sending...' : 'Send Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HRApprovals;


