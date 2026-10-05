cmake_minimum_required(VERSION 3.18)
project(ctre_phoenix5_vendor NONE)

find_package(ament_cmake REQUIRED)

# Pinned CTRE releases. These are byte-identical to the libraries the motor
# bench test ran on in April 2026. To upgrade, see README.md.
set(PHOENIX5_VERSION "5.36.0")
set(PHOENIX6_TOOLS_VERSION "26.1.3")

if(CMAKE_SYSTEM_PROCESSOR MATCHES "^(x86_64|AMD64)$")
  set(ctre_arch "x86-64")
  set(api_cpp_sha256 "8929edd9e6656310c9bb54af98a4774e332b4e46982789574f16fcd5af3683ad")
  set(cci_sha256 "a9b90ec1190a87b8d1b933e3f22cfd5b029c1d52e046f47809f906e90f8a8630")
  set(tools_sha256 "ccc4eec96c8ce772814fd9d6ef8ff89e7bf54d0db1b3c4593338501a2f85d2b0")
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "^(aarch64|arm64)$")
  set(ctre_arch "arm64")
  set(api_cpp_sha256 "aeab0bb423c08b31df369388965ec65c6ee95f21ab6bd190405b872609303519")
  set(cci_sha256 "6a453864021c7f9658d5500a18e58224dab336a8cf079844b3daa636874a7976")
  set(tools_sha256 "2cd583c17453943ef85122738e9173788810a4853f6b2dcb4f057df5897f1218")
else()
  message(FATAL_ERROR
    "CTRE publishes no Phoenix 5 Linux libraries for '${CMAKE_SYSTEM_PROCESSOR}'.")
endif()

if(DEFINED ENV{XDG_CACHE_HOME})
  set(default_download_dir "$ENV{XDG_CACHE_HOME}/ctre_phoenix5_vendor")
else()
  set(default_download_dir "$ENV{HOME}/.cache/ctre_phoenix5_vendor")
endif()
set(CTRE_DOWNLOAD_DIR "${default_download_dir}" CACHE PATH
  "Where downloaded CTRE archives are kept, so rebuilds work offline")
set(CTRE_MAVEN_URL "https://maven.ctr-electronics.com/release/com/ctre" CACHE STRING
  "Base URL of CTRE's maven repository")

set(extract_dir "${CMAKE_CURRENT_BINARY_DIR}/ctre")
file(REMOVE_RECURSE "${extract_dir}")

# Makes sure one CTRE archive is in CTRE_DOWNLOAD_DIR with the expected
# SHA-256, downloading it if needed, then extracts it into the build directory.
function(ctre_fetch group artifact version classifier expected_sha256)
  set(file_name "${artifact}-${version}-${classifier}.zip")
  set(archive "${CTRE_DOWNLOAD_DIR}/${file_name}")
  set(actual_sha256 "")
  if(EXISTS "${archive}")
    file(SHA256 "${archive}" actual_sha256)
  endif()

  if(NOT actual_sha256 STREQUAL expected_sha256)
    set(url "${CTRE_MAVEN_URL}/${group}/${artifact}/${version}/${file_name}")
    message(STATUS "Downloading ${url}")
    file(DOWNLOAD "${url}" "${archive}.part" STATUS status TLS_VERIFY ON)
    list(GET status 0 status_code)
    if(NOT status_code EQUAL 0)
      list(GET status 1 status_message)
      file(REMOVE "${archive}.part")
      message(FATAL_ERROR
        "Could not download ${url} (${status_message}).\n"
        "Check your internet connection. To build offline, copy ${file_name} "
        "into ${CTRE_DOWNLOAD_DIR} from a machine that has it.")
    endif()
    file(SHA256 "${archive}.part" actual_sha256)
    if(NOT actual_sha256 STREQUAL expected_sha256)
      file(REMOVE "${archive}.part")
      message(FATAL_ERROR
        "${file_name} has SHA-256 ${actual_sha256}, expected ${expected_sha256}.\n"
        "The download is corrupt or not the file CTRE published for this version.")
    endif()
    file(RENAME "${archive}.part" "${archive}")
  endif()

  file(ARCHIVE_EXTRACT INPUT "${archive}" DESTINATION "${extract_dir}")
endfunction()

ctre_fetch(phoenix api-cpp ${PHOENIX5_VERSION} headers
  "56424531c25bd9cfbd03f127442dbc92ef011b90e0befcaf4b1c5a81f561ee87")
ctre_fetch(phoenix cci ${PHOENIX5_VERSION} headers
  "6a48affde5bfbe1ace8caf82b0087fbd9f27f4998d272d96ecf722b1ebc8aad3")
ctre_fetch(phoenix6 tools ${PHOENIX6_TOOLS_VERSION} headers
  "daa7ba1dd01780b0b68ce9dd0c2467f6a860b15df278917ebc018f150da9f020")
ctre_fetch(phoenix api-cpp ${PHOENIX5_VERSION} linux${ctre_arch} ${api_cpp_sha256})
ctre_fetch(phoenix cci ${PHOENIX5_VERSION} linux${ctre_arch} ${cci_sha256})
ctre_fetch(phoenix6 tools ${PHOENIX6_TOOLS_VERSION} linux${ctre_arch} ${tools_sha256})

install(DIRECTORY "${extract_dir}/ctre" DESTINATION include/${PROJECT_NAME})
install(
  FILES
    "${extract_dir}/linux/${ctre_arch}/shared/libCTRE_Phoenix.so"
    "${extract_dir}/linux/${ctre_arch}/shared/libCTRE_PhoenixCCI.so"
    "${extract_dir}/linux/${ctre_arch}/shared/libCTRE_PhoenixTools.so"
  DESTINATION lib)
install(
  FILES
    "${extract_dir}/LICENSE.txt"
    "${extract_dir}/CTRE_LICENSE.txt"
  DESTINATION share/${PROJECT_NAME}/ctre_licenses)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # Files carry no copyright header because the repository LICENSE covers them.
  list(APPEND AMENT_LINT_AUTO_EXCLUDE ament_cmake_copyright)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package(CONFIG_EXTRAS cmake/ctre_phoenix5_vendor-extras.cmake)
