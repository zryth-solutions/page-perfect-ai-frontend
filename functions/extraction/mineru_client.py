"""
MinerU 2.5 API Client
Integrates with MinerU API to extract PDFs to markdown format using VLM model
"""

import requests
import time
import os
from typing import Dict, Any, Optional


class MinerUClient:
    """Client for interacting with MinerU 2.5 API"""
    
    BASE_URL = "https://mineru.net/api/v4"
    
    def __init__(self, token: str):
        """
        Initialize MinerU client
        
        Args:
            token: MinerU API token (Bearer token)
        """
        self.token = token
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    
    def create_extraction_task(
        self,
        pdf_url: str,
        is_ocr: bool = True,
        enable_formula: bool = True,
        enable_table: bool = True,
        language: str = "en",
        model_version: str = "vlm",
        data_id: Optional[str] = None,
        callback: Optional[str] = None,
        seed: Optional[str] = None,
        extra_formats: Optional[list] = None,
        page_ranges: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a PDF extraction task with maximum accuracy settings
        
        Args:
            pdf_url: URL of the PDF file to extract
            is_ocr: Whether to enable OCR functionality (default: True)
            enable_formula: Whether to enable formula recognition (default: True)
            enable_table: Whether to enable table recognition (default: True)
            language: Document language (default: "en" for English, use "ch" for Chinese)
            model_version: Model version - 'vlm' or 'pipeline' (default: vlm)
            data_id: Optional data ID for identifying the parsing object
            callback: Optional callback URL for notifications
            seed: Random string for callback signature (required if callback is set)
            extra_formats: Additional export formats (docx, html, latex)
            page_ranges: Page range specification (e.g., "1-600", "2,4-6")
        
        Returns:
            Dictionary with task_id and response data
        """
        url = f"{self.BASE_URL}/extract/task"
        
        data = {
            "url": pdf_url,
            "is_ocr": is_ocr,
            "enable_formula": enable_formula,
            "enable_table": enable_table,
            "language": language,
            "model_version": model_version
        }
        
        # Add optional parameters
        if data_id:
            data["data_id"] = data_id
        if callback:
            data["callback"] = callback
            if seed:
                data["seed"] = seed
        if extra_formats:
            data["extra_formats"] = extra_formats
        if page_ranges:
            data["page_ranges"] = page_ranges
        
        try:
            print(f"Creating extraction task for: {pdf_url}")
            print(f"Settings: OCR={is_ocr}, Formula={enable_formula}, Table={enable_table}, Lang={language}, Model={model_version}")
            
            response = requests.post(url, headers=self.headers, json=data, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            print(f"API Response: {result}")
            
            if result.get("code") != 0:
                raise Exception(f"API Error: {result.get('msg', 'Unknown error')}")
            
            return {
                "success": True,
                "task_id": result["data"]["task_id"],
                "trace_id": result.get("trace_id"),
                "full_response": result
            }
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
        except Exception as e:
            print(f"Unexpected error: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get the status of an extraction task
        
        Args:
            task_id: The task ID returned from create_extraction_task
        
        Returns:
            Dictionary with task status and results
        """
        url = f"{self.BASE_URL}/extract/task/{task_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if result.get("code") != 0:
                raise Exception(f"API Error: {result.get('msg', 'Unknown error')}")
            
            task_data = result["data"]
            status = task_data.get("state")
            
            response_dict = {
                "success": True,
                "task_id": task_data.get("task_id"),
                "state": status,
                "trace_id": result.get("trace_id"),
                "full_response": result
            }
            
            # Add status-specific information
            if status == "done":
                response_dict["full_zip_url"] = task_data.get("full_zip_url")
                response_dict["data_id"] = task_data.get("data_id")
            elif status == "failed":
                response_dict["err_msg"] = task_data.get("err_msg", "Unknown error")
            elif status in ["pending", "running", "converting"]:
                progress = task_data.get("extract_progress", {})
                response_dict["progress"] = {
                    "extracted_pages": progress.get("extracted_pages", 0),
                    "total_pages": progress.get("total_pages", 0),
                    "start_time": progress.get("start_time")
                }
            
            return response_dict
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
    
    def wait_for_completion(
        self,
        task_id: str,
        poll_interval: int = 5,
        max_wait_time: int = 3600,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Poll for task completion
        
        Args:
            task_id: The task ID to poll
            poll_interval: Seconds between status checks (default: 5)
            max_wait_time: Maximum time to wait in seconds (default: 3600 = 1 hour)
            progress_callback: Optional callback function(status_dict) to call on each poll
        
        Returns:
            Dictionary with final task status
        """
        start_time = time.time()
        
        while True:
            elapsed = time.time() - start_time
            if elapsed > max_wait_time:
                return {
                    "success": False,
                    "error": f"Task did not complete within {max_wait_time} seconds",
                    "task_id": task_id
                }
            
            status = self.get_task_status(task_id)
            
            if not status.get("success"):
                return status
            
            state = status.get("state")
            
            # Call progress callback if provided
            if progress_callback:
                try:
                    progress_callback(status)
                except Exception as e:
                    print(f"Warning: Progress callback error: {e}")
            
            if state == "done":
                return status
            elif state == "failed":
                return status
            elif state in ["pending", "running", "converting"]:
                # Show progress if available
                progress = status.get("progress", {})
                if progress:
                    extracted = progress.get("extracted_pages", 0)
                    total = progress.get("total_pages", 0)
                    if total > 0:
                        print(f"Progress: {extracted}/{total} pages extracted...")
                time.sleep(poll_interval)
            else:
                # Unknown state, wait and retry
                time.sleep(poll_interval)
    
    def download_result_zip(self, zip_url: str, output_path: str) -> Dict[str, Any]:
        """
        Download the result ZIP file from MinerU
        
        Args:
            zip_url: URL of the ZIP file from task result
            output_path: Local path to save the ZIP file
        
        Returns:
            Dictionary with download status
        """
        try:
            response = requests.get(zip_url, stream=True, timeout=300)
            response.raise_for_status()
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
            
            # Download with progress indication
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(f"\rDownloading: {percent:.1f}%", end="", flush=True)
            
            print()  # New line after progress
            
            return {
                "success": True,
                "output_path": output_path,
                "file_size": downloaded
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
