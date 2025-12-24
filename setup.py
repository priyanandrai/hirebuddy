"""
Setup configuration for HireBuddy
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="hirebuddy",
    version="0.1.0",
    author="HireBuddy Community",
    description="Connect with local helpers for everyday tasks",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/priyanandrai/hirebuddy",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.7",
    install_requires=[
        # No external dependencies for MVP
    ],
)
